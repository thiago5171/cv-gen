# CV Generator Docs

## Purpose

Provide a short, AI-readable spec to build a CV generator that fills a
DOCX template from JSON and allows DOCX/PDF downloads.

## Decisions (current)

- Use the existing DOCX as the template base and add placeholders.
- User can download DOCX, PDF, or both.
- JSON schema is derived from the DOCX structure.
- PDF conversion is client-side via docx-preview + html2pdf.js.

## Doc Map

- 00-problem.md
- 01-solution-outline.md
- 02-json-schema.md
- 03-template-strategy.md
- 04-ui-flow.md
- 05-pdf-strategy.md
- tickets/README.md
