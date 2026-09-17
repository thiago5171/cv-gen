/**
 * Deterministic JSON serializer: object keys are emitted in sorted order so
 * the same data always produces byte-identical output. Used for anything that
 * goes into the cached prompt prefix (the profile, the schema) — a varying key
 * order would silently invalidate the prompt cache.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== "object") return value;
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    out[key] = sortKeys(obj[key]);
  }
  return out;
}
