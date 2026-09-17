import type Anthropic from "@anthropic-ai/sdk";

/** Concatenate all text blocks of a message (structured output lands here). */
export function collectText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
