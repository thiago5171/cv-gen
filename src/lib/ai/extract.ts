/**
 * extract.ts
 * Turns an uploaded background file into compact plain text in the browser.
 *
 * Why extract instead of sending the original: a 2-page PDF sent as a
 * `document` block costs ~15-40k tokens (text + a rendered image per page);
 * the extracted text is ~1-2k tokens. We store only the text. The single
 * exception is a scanned PDF with no text layer — there we keep the base64 so
 * distillation can fall back to a `document` block.
 *
 * pdfjs-dist and mammoth are dynamically imported so they don't weigh on the
 * Manual tab's bundle.
 */

import type { BackgroundDoc } from "./types";

const uid = () =>
  (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);

const approxTokens = (text: string) => Math.ceil(text.length / 4);

function normalize(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .trim();
}

function extOf(name: string): string {
  return name.slice(name.lastIndexOf(".") + 1).toLowerCase();
}

async function fileToBase64(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buf.length; i += 0x8000) {
    binary += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function extractPdf(file: File): Promise<{ text: string; base64?: string }> {
  const pdfjs = await import("pdfjs-dist");
  // Vite-friendly worker resolution.
  const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(line);
  }
  const text = normalize(pages.join("\n\n"));

  // Almost no text → likely a scanned/image PDF. Keep base64 for a document fallback.
  if (text.replace(/\s/g, "").length < 40) {
    return { text, base64: await fileToBase64(file) };
  }
  return { text };
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return normalize(result.value);
}

export type ExtractResult = {
  doc: BackgroundDoc;
  /** Warning shown to the user (e.g. scanned PDF fallback), if any. */
  warning?: string;
};

export async function extractFile(file: File): Promise<ExtractResult> {
  const ext = extOf(file.name);
  const base: Pick<BackgroundDoc, "id" | "name" | "addedAt"> = {
    id: uid(),
    name: file.name,
    addedAt: Date.now(),
  };

  if (ext === "pdf") {
    const { text, base64 } = await extractPdf(file);
    if (base64) {
      return {
        doc: {
          ...base,
          kind: "pdf",
          text,
          approxTokens: approxTokens(text),
          fallbackPdfBase64: base64,
        },
        warning: `"${file.name}" parece ser um PDF escaneado (sem texto). Será enviado como documento na destilação (mais caro).`,
      };
    }
    return { doc: { ...base, kind: "pdf", text, approxTokens: approxTokens(text) } };
  }

  if (ext === "docx") {
    const text = await extractDocx(file);
    return { doc: { ...base, kind: "docx", text, approxTokens: approxTokens(text) } };
  }

  if (ext === "md" || ext === "txt") {
    const text = normalize(await file.text());
    return { doc: { ...base, kind: ext, text, approxTokens: approxTokens(text) } };
  }

  throw new Error(`Formato não suportado: .${ext} (use PDF, DOCX, MD ou TXT).`);
}

/** A free-text "about me" block typed directly into the UI. */
export function makeTextDoc(text: string): BackgroundDoc {
  const clean = normalize(text);
  return {
    id: uid(),
    name: "Sobre mim (texto livre)",
    kind: "text",
    text: clean,
    approxTokens: approxTokens(clean),
    addedAt: Date.now(),
  };
}
