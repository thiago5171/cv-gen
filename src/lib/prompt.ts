import { sampleFull, sampleMinimal } from "../data/samples";

export function buildPrompt(): string {
  const minimal = JSON.stringify(sampleMinimal, null, 2);
  const full = JSON.stringify(sampleFull, null, 2);

  return [
    "You are helping adapt a CV for a specific role.",
    "Keep the JSON structure exactly as provided.",
    "Do not rename keys or change data types.",
    "Return only valid JSON. No markdown.",
    "",
    "Input constraints:",
    "- Output must follow the same schema and order.",
    "- Follow the schema reference: src/data/cv.schema.json.",
    "- Every experience item must include responsibilities, keyResults, and skills arrays.",
    "- Use concise, ATS-friendly wording.",
    "",
    "Minimal example:",
    minimal,
    "",
    "Full example:",
    full,
  ].join("\n");
}
