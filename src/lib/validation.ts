import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import schema from "../data/cv.schema.json";

export type ValidationResult = {
  ok: boolean;
  errors: string[];
  data?: unknown;
};

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

export function validateCvJson(raw: string): ValidationResult {
  let data: unknown;

  try {
    data = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON invalido";
    return { ok: false, errors: [`JSON invalido: ${message}`] };
  }

  const valid = validate(data);
  if (valid) {
    return { ok: true, errors: [], data };
  }

  return { ok: false, errors: formatAjvErrors(validate.errors), data };
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors || errors.length === 0) {
    return ["Schema invalido."];
  }

  return errors.map((error) => {
    if (error.keyword === "required") {
      const missing = (error.params as { missingProperty: string })
        .missingProperty;
      const basePath = formatInstancePath(error.instancePath);
      const fullPath = basePath ? `${basePath}.${missing}` : missing;
      return `Campo obrigatorio ausente: ${fullPath}`;
    }

    const path = formatInstancePath(error.instancePath);
    const message = error.message ?? "Valor invalido.";
    return path ? `${path}: ${message}` : message;
  });
}

function formatInstancePath(instancePath: string): string {
  if (!instancePath) {
    return "";
  }

  const segments = instancePath.split("/").filter(Boolean);
  return segments
    .map((segment) => {
      const decoded = segment.replace(/~1/g, "/").replace(/~0/g, "~");
      return Number.isFinite(Number(decoded)) && decoded.trim() !== ""
        ? `[${decoded}]`
        : `.${decoded}`;
    })
    .join("")
    .replace(/^\./, "");
}
