# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CV Gen is a client-side React app that takes CV data as JSON, validates it against a schema, and generates downloadable DOCX and PDF files. The UI is in Portuguese (pt-BR). There is no backend — all rendering happens in the browser.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — type-check with `tsc -b` then bundle with Vite
- `npm run lint` — ESLint
- `node scripts/generate-templates.mjs` — regenerate DOCX templates in `public/templates/` (uses the `docx` library as a devDependency to programmatically build `.docx` files with docxtemplater placeholders)
- `node scripts/verify-template.mjs` — verify placeholders in generated templates aren't fragmented across XML tags

No test framework is configured.

## Architecture

### Data flow

```
JSON input → AJV validation (cv.schema.json) → CvData type
  ├─ DOCX path: fetch template → PizZip + docxtemplater → download blob
  ├─ PDF path:  renderCvHtml() → html2pdf.js (html2canvas + jsPDF) → download blob
  └─ Preview:   renderCvHtml() → iframe srcDoc
```

### Key modules

- **`src/lib/cv-renderer.ts`** — Builds a self-contained HTML string from `CvData`. Owns the `CvData` type and all section labels (pt-BR / en-US). This HTML is used for both the in-app preview and PDF generation.
- **`src/lib/documents.ts`** — DOCX generation via docxtemplater (fetches template, flattens nested keys to dot-notation for placeholder resolution) and PDF generation via html2pdf.js. Contains the `downloadBlob` helper.
- **`src/lib/validation.ts`** — AJV-based validation against `src/data/cv.schema.json`. Returns structured errors with JSON-path formatting.
- **`src/lib/templates.ts`** — Language-to-template-path mapping. Currently active: `pt-BR` and `en-US`. `es-ES` and `de-DE` are declared but disabled.
- **`src/lib/prompt.ts`** — Generates a copyable AI prompt with the JSON schema contract and sample data.
- **`src/lib/redteam.ts`** — Red-team mode for testing the user's own resume screener. A top-level `_injection` key in the input JSON (`"texto"` or `{ text, vector }`) is stripped before validation and written as hidden text into the DOCX (`document.xml` run props) and PDF (real text added to the jsPDF instance after rasterization, since html2canvas output has no text layer). `scripts/generate-injection-tests.mjs` batch-generates the same vectors × payloads from the CLI.
- **`src/data/samples.ts`** — `sampleMinimal` and `sampleFull` objects used as editor presets and in the prompt builder.

### DOCX template pipeline

Templates are **not hand-edited** — they are generated programmatically by `scripts/generate-templates.mjs` using the `docx` npm package. The script outputs `.docx` files with docxtemplater syntax (`{name}`, `{#experience}...{/experience}`, `{basicInfo.title}`). At runtime, `documents.ts` flattens the CV JSON so both dot-notation (`{basicInfo.title}`) and loop syntax (`{#experience}{role}{/experience}`) resolve correctly.

### Schema

`src/data/cv.schema.json` is the single source of truth for the JSON contract. Required top-level fields: `name`, `basicInfo`, `experience`, `education`. Optional: `summary`, `languages`, `certifications`, `skills`. All schemas use `additionalProperties: false`.

## Conventions

- The app is a single `App.tsx` component with no routing or state management library.
- UI strings and status messages are in Portuguese.
- Two language variants exist for CV output: pt-BR and en-US, controlled by a language selector that maps to template paths and label sets in `cv-renderer.ts`.
