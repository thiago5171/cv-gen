/**
 * schema.ts
 * Prepares JSON Schemas for the Anthropic structured-output API
 * (`output_config.format`). The API's schema subset does NOT support
 * validation keywords like `minLength`, `minItems`, `minimum`, or union
 * `type` arrays, and it requires `additionalProperties: false`. AJV keeps
 * using the original schema for local validation; this only affects the copy
 * sent to the model.
 *
 * The output is deterministic (keys walked in place) so the serialized schema
 * stays byte-stable across calls — required for prompt caching.
 */

const STRIP_KEYS = new Set([
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
  "minimum",
  "maximum",
  "multipleOf",
  "pattern",
  "$schema",
  "title",
  "format",
]);

type JsonSchema = Record<string, unknown>;

export function sanitizeSchemaForApi(schema: JsonSchema): JsonSchema {
  return walk(schema) as JsonSchema;
}

function walk(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(walk);
  if (node === null || typeof node !== "object") return node;

  const out: JsonSchema = {};
  for (const [key, value] of Object.entries(node as JsonSchema)) {
    if (STRIP_KEYS.has(key)) continue;

    // Union type arrays (e.g. ["string", "number"]) are unsupported — collapse
    // to the first type, which for our schemas is always the primary form.
    if (key === "type" && Array.isArray(value)) {
      out[key] = value[0];
      continue;
    }

    out[key] = walk(value);
  }
  return out;
}
