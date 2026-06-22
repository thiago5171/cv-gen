# Project Context

## Product

Front-end app to generate a CV by filling a DOCX template with JSON.
The output must preserve the original DOCX layout and branding.

## Problem

Manual copy/paste into the template is slow and error prone.

## Goals (v1)

- Paste JSON and generate DOCX.
- Allow optional PDF download.
- Keep the template layout unchanged.
- Provide a copyable AI prompt with JSON examples.

## Constraints

- Template was made in Google Docs.
- JSON schema must match the DOCX structure.
- Keep UI simple and fast; no auth.

## Decisions

- Use the existing DOCX as the template base with placeholders.
- User can download DOCX, PDF, or both.

## Open Decisions

- PDF conversion approach.

## Source Docs

- docs/README.md
- docs/00-problem.md
- docs/01-solution-outline.md
- docs/02-json-schema.md
- docs/03-template-strategy.md
- docs/04-ui-flow.md
- docs/05-pdf-strategy.md
