/**
 * local.ts
 * "Claude Code (local)" provider — mirrors the API provider (profile.ts /
 * generate.ts) but runs through the dev-server endpoint that shells out to the
 * user's `claude` CLI. Uses the Claude Code subscription, no API key/credits.
 * Works only under `npm run dev` (the static build has no server).
 */

import cvSchema from "../../data/cv.schema.json";
import profileSchema from "../../data/profile.schema.json";
import { sanitizeSchemaForApi } from "./schema";
import { stableStringify } from "./stableStringify";
import { estimateCost } from "./cost";
import { DISTILL_INSTRUCTIONS, GENERATE_INSTRUCTIONS, REFINE_HINT } from "./prompts";
import {
  usageFromCost,
  type AiSettings,
  type BackgroundDoc,
  type ConversationTurn,
  type TokenUsage,
} from "./types";

const CV_SCHEMA_API = sanitizeSchemaForApi(cvSchema as Record<string, unknown>);
const PROFILE_SCHEMA_API = sanitizeSchemaForApi(profileSchema as Record<string, unknown>);
const CV_SCHEMA_TEXT = JSON.stringify(cvSchema);

type ClaudeUsage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
};

type LocalResponse =
  | { ok: true; data: unknown; usage: ClaudeUsage | null; costUsd: number | null }
  | { ok: false; error: string };

async function callLocal(
  prompt: string,
  schema: Record<string, unknown>,
  model: string,
): Promise<{ data: unknown; usage: TokenUsage }> {
  let res: Response;
  try {
    res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, schema, model }),
    });
  } catch {
    throw new Error(
      "Endpoint local indisponível. O modo Claude Code só funciona com 'npm run dev' rodando.",
    );
  }

  const body = (await res.json()) as LocalResponse;
  if (!body.ok) throw new Error(body.error);

  // Prefer the CLI's own reported cost; fall back to our price table.
  const fallback = estimateCost(
    {
      input_tokens: body.usage?.input_tokens,
      output_tokens: body.usage?.output_tokens,
      cache_creation_input_tokens: body.usage?.cache_creation_input_tokens,
      cache_read_input_tokens: body.usage?.cache_read_input_tokens,
    },
    model as AiSettings["model"],
  );
  const usage = usageFromCost(fallback, model as AiSettings["model"]);
  if (typeof body.costUsd === "number") usage.usd = body.costUsd;

  return { data: body.data, usage };
}

function docsToText(docs: BackgroundDoc[]): string {
  const parts = docs
    .filter((d) => d.text.trim())
    .map((d) => `### ${d.name} (${d.kind})\n${d.text}`);
  return parts.join("\n\n---\n\n");
}

// ─── Distillation ──────────────────────────────────────────────────────────

export async function distillProfileLocal(
  docs: BackgroundDoc[],
  settings: AiSettings,
): Promise<{ profile: unknown; usage: TokenUsage }> {
  const text = docsToText(docs);
  if (!text) {
    throw new Error("Nenhum documento com texto. (PDF escaneado não é suportado no modo local.)");
  }
  const prompt = `${DISTILL_INSTRUCTIONS}\n\nDocumentos:\n${text}`;
  const { data, usage } = await callLocal(prompt, PROFILE_SCHEMA_API, settings.model);
  return { profile: data, usage };
}

// ─── Generation & refinement ───────────────────────────────────────────────

function generationResult(
  data: unknown,
  usage: TokenUsage,
  turns: ConversationTurn[],
) {
  return {
    cv: data,
    usage,
    turns,
    // The CLI re-primes its own prompt each call; there is no cross-call cache
    // for our prefix, so don't claim a hit.
    cacheHit: false,
    assistantTurn: { role: "assistant" as const, content: JSON.stringify(data) },
  };
}

export async function generateCvLocal(
  profile: unknown,
  jobDescription: string,
  settings: AiSettings,
) {
  const userTurn: ConversationTurn = {
    role: "user",
    content: `Descrição da vaga:\n${jobDescription}`,
  };
  const prompt = [
    GENERATE_INSTRUCTIONS,
    `Schema do CV (siga exatamente):\n${CV_SCHEMA_TEXT}`,
    `Perfil canônico do candidato:\n${stableStringify(profile)}`,
    userTurn.content,
  ].join("\n\n");

  const { data, usage } = await callLocal(prompt, CV_SCHEMA_API, settings.model);
  const base = generationResult(data, usage, []);
  return { ...base, turns: [userTurn, base.assistantTurn] };
}

export async function refineCvLocal(
  profile: unknown,
  priorTurns: ConversationTurn[],
  instruction: string,
  settings: AiSettings,
) {
  // No live session across CLI calls — feed the current CV back explicitly.
  const lastCv = [...priorTurns].reverse().find((t) => t.role === "assistant")?.content ?? "{}";
  const userTurn: ConversationTurn = {
    role: "user",
    content: `${REFINE_HINT}\n\nInstrução: ${instruction}`,
  };
  const prompt = [
    GENERATE_INSTRUCTIONS,
    `Schema do CV (siga exatamente):\n${CV_SCHEMA_TEXT}`,
    `Perfil canônico do candidato:\n${stableStringify(profile)}`,
    `CV atual:\n${lastCv}`,
    userTurn.content,
  ].join("\n\n");

  const { data, usage } = await callLocal(prompt, CV_SCHEMA_API, settings.model);
  const base = generationResult(data, usage, []);
  return { ...base, turns: [...priorTurns, userTurn, base.assistantTurn] };
}
