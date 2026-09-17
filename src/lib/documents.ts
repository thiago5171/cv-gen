import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import html2pdf from "html2pdf.js";
import {
  injectDocx,
  injectPdf,
  type InjectionConfig,
  type JsPdfLike,
} from "./redteam";

export type DocxRenderError = {
  message: string;
  details?: string[];
};

// ─── Flatten nested object into dot-notation keys for docxtemplater ───────────
// docxtemplater does NOT resolve {basicInfo.title} as data.basicInfo.title
// by default — it looks for a literal key named "basicInfo.title".
// This function creates those flat keys alongside the original nested structure
// so both {basicInfo.title} and {#basicInfo}{title}{/basicInfo} work.

function flattenForDocx(
  obj: Record<string, unknown>,
  prefix = "",
  result: Record<string, unknown> = {},
): Record<string, unknown> {
  for (const [key, value] of Object.entries(obj)) {
    const dotKey = prefix ? `${prefix}.${key}` : key;
    result[dotKey] = value;
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      flattenForDocx(value as Record<string, unknown>, dotKey, result);
    }
  }
  return result;
}

// Strip [text](url) markdown links from all string values recursively.
// Users paste from Google Docs / Notion which wraps emails and URLs in markdown.
function stripMarkdownLinks(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  }
  if (Array.isArray(value)) {
    return value.map(stripMarkdownLinks);
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = stripMarkdownLinks(v);
    }
    return result;
  }
  return value;
}

function prepareDocxData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const clean = stripMarkdownLinks(data) as Record<string, unknown>;
  // Ensure experience entries have explicit `summary` so docxtemplater
  // doesn't fall back to the root-level `summary` inside the loop.
  if (Array.isArray(clean.experience)) {
    clean.experience = (clean.experience as Record<string, unknown>[]).map(
      (entry) => ({ summary: "", ...entry }),
    );
  }
  return { ...clean, ...flattenForDocx(clean) };
}

// ─── DOCX via docxtemplater ───────────────────────────────────────────────────

export async function buildDocxBlob(
  templatePath: string,
  data: Record<string, unknown>,
  injection: InjectionConfig | null = null,
): Promise<{ blob: Blob } | { error: DocxRenderError }> {
  try {
    const response = await fetch(templatePath);
    if (!response.ok) {
      return {
        error: {
          message: `Falha ao carregar template (${response.status}).`,
        },
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    try {
      doc.render(prepareDocxData(data));
    } catch (error) {
      return { error: formatDocxError(error) };
    }

    if (injection) {
      injectDocx(doc.getZip(), injection);
    }

    const blob = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return { blob };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao gerar DOCX.";
    return { error: { message } };
  }
}

// ─── PDF via HTML renderer ────────────────────────────────────────────────────
// html2canvas needs the element to be visible and in-flow.
// We add a real element to the DOM, capture it, then remove it immediately.

const PDF_MARGIN_PT = 28; // ≈ 1cm

export async function downloadPdfFromHtml(
  htmlString: string,
  filename: string,
  injection: InjectionConfig | null = null,
): Promise<void> {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(htmlString, "text/html");

  const styleEl = document.createElement("style");
  styleEl.setAttribute("data-cv-temp", "1");
  styleEl.textContent = Array.from(parsed.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");
  document.head.appendChild(styleEl);

  const container = document.createElement("div");
  container.setAttribute("data-cv-temp", "1");
  container.style.cssText =
    "width:794px;background:#fff;overflow:hidden;";
  container.innerHTML = parsed.body.innerHTML;
  // Vertical spacing comes from the html2pdf page margin below so it repeats
  // on every page; the inner padding would only pad the first one.
  const page = container.firstElementChild as HTMLElement | null;
  if (page) {
    page.style.paddingTop = "0";
    page.style.paddingBottom = "0";
    page.style.minHeight = "0";
  }
  document.body.appendChild(container);

  try {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const worker = html2pdf()
      .set({
        // [top, left, bottom, right] in pt — applied to every page.
        margin: [PDF_MARGIN_PT, 0, PDF_MARGIN_PT, 0],
        filename,
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        },
        jsPDF: {
          unit: "pt",
          format: "a4",
          orientation: "portrait",
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      })
      .from(container)
      .toPdf();

    // The rendered page is a raster image; a hidden payload must be written
    // as real text into the jsPDF instance so text extractors can see it.
    if (injection) {
      await worker
        .get("pdf")
        .then((pdf) => injectPdf(pdf as JsPdfLike, injection))
        .save();
    } else {
      await worker.save();
    }
  } finally {
    document
      .querySelectorAll("[data-cv-temp]")
      .forEach((el) => el.remove());
  }
}

// ─── Blob download helper ─────────────────────────────────────────────────────
// revokeObjectURL must be DELAYED — calling it synchronously revokes the URL
// before the browser reads it, causing it to open blob:// instead of downloading.
// For Chrome: we also try window.open as fallback if the click doesn't trigger a download.

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke after 2 minutes — enough time for any browser to start the download
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

// ─── Error formatter ──────────────────────────────────────────────────────────

function formatDocxError(error: unknown): DocxRenderError {
  const message =
    error instanceof Error ? error.message : "Falha ao renderizar DOCX.";

  if (error && typeof error === "object" && "properties" in error) {
    const properties = (
      error as {
        properties?: {
          errors?: Array<{ properties?: { explanation?: string } }>;
        };
      }
    ).properties;

    const details = properties?.errors
      ?.map((item) => item.properties?.explanation)
      .filter((detail): detail is string => Boolean(detail));

    if (details && details.length > 0) {
      return { message, details };
    }
  }

  return { message };
}
