/**
 * vite-claude-plugin.mjs
 * Dev-only Vite middleware exposing POST /api/claude.
 *
 * It shells out to the user's locally installed `claude` CLI (Claude Code) in
 * headless mode with structured output, so the AI tab can generate CVs using
 * the user's Claude Code subscription instead of a paid API key. It runs the
 * same binary the user runs in their terminal — no token handling, no external
 * calls of our own. Local dev only; a static production build has no server to
 * run subprocesses.
 *
 * Request  body: { prompt: string, schema: object, model?: string }
 * Response body: { ok: true, data: <parsed JSON>, usage?, costUsd? }
 *              | { ok: false, error: string }
 */

import { spawn } from "node:child_process";

const CLAUDE_BIN = process.platform === "win32" ? "claude.exe" : "claude";
const TIMEOUT_MS = 180_000;

/**
 * Parse the CLI's JSON envelope tolerantly: the whole stdout is normally one
 * JSON object, but a first-run update/notice banner can precede it. Fall back
 * to the outermost {...} slice.
 */
function parseEnvelope(stdout) {
  try {
    return JSON.parse(stdout);
  } catch {
    const start = stdout.indexOf("{");
    const end = stdout.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(stdout.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function runClaude({ prompt, schema, model }) {
  return new Promise((resolve) => {
    const args = ["-p", "--output-format", "json", "--json-schema", JSON.stringify(schema)];
    if (model) args.push("--model", model);

    let child;
    try {
      child = spawn(CLAUDE_BIN, args, { windowsHide: true });
    } catch (e) {
      resolve({ ok: false, error: `Falha ao iniciar o claude CLI: ${e.message}` });
      return;
    }

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      resolve({ ok: false, error: "Tempo esgotado ao chamar o claude CLI (timeout)." });
    }, TIMEOUT_MS);

    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      const hint =
        e.code === "ENOENT"
          ? "Comando 'claude' não encontrado no PATH. Instale/entre no Claude Code CLI."
          : e.message;
      resolve({ ok: false, error: hint });
    });
    child.on("close", () => {
      clearTimeout(timer);
      const envelope = parseEnvelope(stdout);
      if (!envelope) {
        resolve({
          ok: false,
          error: `Saída inesperada do claude CLI. ${stderr.slice(0, 300)}`.trim(),
        });
        return;
      }
      if (envelope.is_error || envelope.subtype !== "success") {
        resolve({
          ok: false,
          error: envelope.result || envelope.api_error_status || "Erro no claude CLI.",
        });
        return;
      }
      // structured_output is the parsed object; fall back to parsing result.
      let data = envelope.structured_output;
      if (data === undefined) {
        try {
          data = JSON.parse(envelope.result);
        } catch {
          resolve({ ok: false, error: "O claude CLI não retornou JSON estruturado." });
          return;
        }
      }
      resolve({
        ok: true,
        data,
        usage: envelope.usage ?? null,
        costUsd: envelope.total_cost_usd ?? null,
      });
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

export function claudeCliPlugin() {
  return {
    name: "claude-cli-endpoint",
    apply: "serve", // dev only
    configureServer(server) {
      server.middlewares.use("/api/claude", async (req, res, next) => {
        if (req.method !== "POST") return next();
        res.setHeader("Content-Type", "application/json");
        try {
          const body = await readBody(req);
          if (!body.prompt || !body.schema) {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: "prompt e schema são obrigatórios." }));
            return;
          }
          const result = await runClaude(body);
          res.statusCode = result.ok ? 200 : 500;
          res.end(JSON.stringify(result));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, error: e?.message ?? "Erro interno." }));
        }
      });
    },
  };
}
