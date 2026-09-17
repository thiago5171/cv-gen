import type { CostBreakdown } from "./cost";

export type AiModelId = "claude-sonnet-5" | "claude-opus-5";
export type Effort = "low" | "medium" | "high";

export type AiSettings = {
  model: AiModelId;
  effort: Effort;
};

/** A background document the user uploaded, stored in IndexedDB. */
export type BackgroundDoc = {
  id: string;
  name: string;
  kind: "pdf" | "docx" | "md" | "txt" | "text";
  /** Extracted plain text — what actually goes to the model. Compact & cheap. */
  text: string;
  /** Approx token count of `text` (chars / 4). */
  approxTokens: number;
  /** Original file bytes (base64) — kept ONLY for scanned PDFs with no text
   *  layer, so distillation can fall back to sending the PDF as a document. */
  fallbackPdfBase64?: string;
  addedAt: number;
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  usd: number;
  model: AiModelId;
};

export function usageFromCost(cost: CostBreakdown, model: AiModelId): TokenUsage {
  return {
    inputTokens: cost.inputTokens,
    outputTokens: cost.outputTokens,
    cacheWriteTokens: cost.cacheWriteTokens,
    cacheReadTokens: cost.cacheReadTokens,
    usd: cost.usd,
    model,
  };
}

/** One generation (+ any refinements) saved to history. */
export type HistoryEntry = {
  id: string;
  jobDescription: string;
  /** Final CV JSON produced. */
  cv: unknown;
  /** Full message turns (job + refinements) for reopening the conversation. */
  turns: ConversationTurn[];
  createdAt: number;
  totalUsd: number;
};

export type ConversationTurn = {
  role: "user" | "assistant";
  /** For user turns: the instruction text. For assistant: serialized CV JSON. */
  content: string;
};
