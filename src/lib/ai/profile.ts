/**
 * profile.ts
 * Distillation: N background docs → one canonical `profile.json`, in a single
 * API call, using structured output. This is the expensive step; it runs only
 * when the user adds/removes a document, not on every CV generation.
 */

import type Anthropic from "@anthropic-ai/sdk";
import profileSchema from "../../data/profile.schema.json";
import { sanitizeSchemaForApi } from "./schema";
import { stopReasonError } from "./client";
import { estimateCost } from "./cost";
import { DISTILL_INSTRUCTIONS } from "./prompts";
import { usageFromCost, type AiSettings, type BackgroundDoc, type TokenUsage } from "./types";
import { collectText } from "./message";

const PROFILE_FORMAT = {
  type: "json_schema" as const,
  schema: sanitizeSchemaForApi(profileSchema as Record<string, unknown>),
};

export type DistillResult = {
  profile: unknown;
  usage: TokenUsage;
};

/** Build the user content: extracted text for each doc + PDF fallback blocks. */
function buildContent(docs: BackgroundDoc[]): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];
  const textParts: string[] = [];

  for (const doc of docs) {
    if (doc.fallbackPdfBase64) {
      blocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: doc.fallbackPdfBase64,
        },
      });
    } else if (doc.text.trim()) {
      textParts.push(`### ${doc.name} (${doc.kind})\n${doc.text}`);
    }
  }

  if (textParts.length) {
    blocks.push({ type: "text", text: textParts.join("\n\n---\n\n") });
  }
  return blocks;
}

export async function distillProfile(
  client: Anthropic,
  docs: BackgroundDoc[],
  settings: AiSettings,
): Promise<DistillResult> {
  const content = buildContent(docs);
  if (content.length === 0) {
    throw new Error("Adicione ao menos um documento com conteúdo antes de processar.");
  }

  const stream = client.messages.stream({
    model: settings.model,
    max_tokens: 32000,
    thinking: { type: "adaptive" },
    output_config: { effort: settings.effort, format: PROFILE_FORMAT },
    system: DISTILL_INSTRUCTIONS,
    messages: [{ role: "user", content }],
  });

  const message = await stream.finalMessage();
  const err = stopReasonError(message.stop_reason);
  if (err) throw new Error(err);

  const raw = collectText(message);
  let profile: unknown;
  try {
    profile = JSON.parse(raw);
  } catch {
    throw new Error("O modelo não retornou um JSON de perfil válido. Tente novamente.");
  }

  const cost = estimateCost(message.usage, settings.model);
  return { profile, usage: usageFromCost(cost, settings.model) };
}
