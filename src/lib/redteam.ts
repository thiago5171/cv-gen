/**
 * redteam.ts
 * Hidden prompt-injection payload support for testing YOUR OWN resume-screening
 * pipeline. Activated only when the input JSON carries a top-level `_injection`
 * key, which is stripped before schema validation and never rendered visibly.
 *
 *   "_injection": "texto"                             → vector "white"
 *   "_injection": { "text": "texto", "vector": "tiny" }
 *
 * Vectors:
 *   white      – text colored like the background (DOCX + PDF)
 *   tiny       – 1pt / 0.5pt font (DOCX + PDF)
 *   white-tiny – both (DOCX; PDF falls back to white)
 *   vanish     – Word hidden-text flag <w:vanish/> (DOCX; PDF falls back to white)
 *   offpage    – drawn outside the page box (PDF; DOCX falls back to white)
 *
 * Do not submit generated files to a real employer.
 */

import type PizZip from "pizzip";

export type InjectionVector = "white" | "tiny" | "white-tiny" | "vanish" | "offpage";

export type InjectionConfig = {
  text: string;
  vector: InjectionVector;
};

const VECTORS: InjectionVector[] = ["white", "tiny", "white-tiny", "vanish", "offpage"];

// ─── Extraction ──────────────────────────────────────────────────────────────

/** Pulls `_injection` out of parsed JSON. Returns the clean data and the config (or null). */
export function extractInjection(parsed: unknown): {
  data: unknown;
  injection: InjectionConfig | null;
  error?: string;
} {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { data: parsed, injection: null };
  }
  const { _injection, ...data } = parsed as Record<string, unknown>;
  if (_injection === undefined) return { data, injection: null };

  if (typeof _injection === "string") {
    return { data, injection: { text: _injection, vector: "white" } };
  }
  if (_injection && typeof _injection === "object") {
    const cfg = _injection as Record<string, unknown>;
    if (typeof cfg.text !== "string" || !cfg.text.trim()) {
      return { data, injection: null, error: "_injection.text deve ser uma string não vazia." };
    }
    const vector = (cfg.vector ?? "white") as InjectionVector;
    if (!VECTORS.includes(vector)) {
      return {
        data,
        injection: null,
        error: `_injection.vector inválido: "${String(cfg.vector)}". Use: ${VECTORS.join(", ")}.`,
      };
    }
    return { data, injection: { text: cfg.text, vector } };
  }
  return { data, injection: null, error: "_injection deve ser string ou { text, vector }." };
}

// ─── DOCX ────────────────────────────────────────────────────────────────────

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Run properties per vector. Font size is in half-points (sz=2 → 1pt).
const DOCX_RPR: Record<InjectionVector, string> = {
  white: `<w:color w:val="FFFFFF"/>`,
  tiny: `<w:sz w:val="2"/><w:szCs w:val="2"/>`,
  "white-tiny": `<w:color w:val="FFFFFF"/><w:sz w:val="2"/><w:szCs w:val="2"/>`,
  vanish: `<w:vanish/>`,
  offpage: `<w:color w:val="FFFFFF"/>`, // no off-page concept in flow layout
};

/** Appends a hidden paragraph to word/document.xml of an already-rendered docx zip. */
export function injectDocx(zip: PizZip, cfg: InjectionConfig): void {
  const file = zip.file("word/document.xml");
  if (!file) return;
  const xml = file.asText();
  const hidden =
    `<w:p><w:r><w:rPr>${DOCX_RPR[cfg.vector]}</w:rPr>` +
    `<w:t xml:space="preserve">${escXml(cfg.text)}</w:t></w:r></w:p>`;
  const patched = xml.includes("<w:sectPr")
    ? xml.replace(/<w:sectPr/, `${hidden}<w:sectPr`)
    : xml.replace("</w:body>", `${hidden}</w:body>`);
  zip.file("word/document.xml", patched);
}

// ─── PDF ─────────────────────────────────────────────────────────────────────
// The app's PDF is a raster (html2canvas), so hidden HTML text would be
// flattened into white pixels — not extractable. The payload must be written
// as real text into the jsPDF instance after rasterization.

/** Minimal surface of jsPDF we touch — avoids depending on jspdf types directly. */
export type JsPdfLike = {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  setPage: (n: number) => unknown;
  setFont: (name: string, style?: string) => unknown;
  setFontSize: (size: number) => unknown;
  setTextColor: (r: number, g?: number, b?: number) => unknown;
  text: (text: string | string[], x: number, y: number) => unknown;
  splitTextToSize: (text: string, maxWidth: number) => string[];
};

export function injectPdf(pdf: JsPdfLike, cfg: InjectionConfig): void {
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  pdf.setPage(1);
  pdf.setFont("helvetica", "normal");

  switch (cfg.vector) {
    case "tiny":
      pdf.setFontSize(0.5);
      pdf.setTextColor(0, 0, 0);
      pdf.text(cfg.text, 20, h - 10);
      break;
    case "offpage":
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(cfg.text, w + 200, h / 2);
      break;
    default: // white, white-tiny, vanish
      pdf.setFontSize(cfg.vector === "white-tiny" ? 0.5 : 9);
      pdf.setTextColor(255, 255, 255);
      pdf.text(pdf.splitTextToSize(cfg.text, w - 40), 20, h - 30);
  }
}

// ─── HTML preview ────────────────────────────────────────────────────────────
// Only so the preview mirrors the document. The PDF path ignores this (raster).

export function injectHtml(html: string, cfg: InjectionConfig): string {
  const style: Record<InjectionVector, string> = {
    white: "color:#fff;font-size:9px;",
    tiny: "color:#000;font-size:1px;line-height:1px;",
    "white-tiny": "color:#fff;font-size:1px;line-height:1px;",
    vanish: "color:#fff;font-size:9px;",
    offpage: "position:absolute;left:-9999px;top:0;",
  };
  const div = `<div data-redteam="1" style="${style[cfg.vector]}">${escXml(cfg.text)}</div>`;
  return html.replace("</body>", `${div}</body>`);
}
