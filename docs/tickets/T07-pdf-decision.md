# T07 - PDF Decision

## Story

As a PO, I need to decide the PDF conversion approach to plan build work.

## Scope

- Compare server-side and client-side options.
- Define the chosen approach and constraints.

## Acceptance Criteria

- Decision recorded with pros/cons.
- Implementation constraints documented.

## Decision

- Selected client-side conversion.
- Render DOCX to HTML using docx-preview and export to PDF with html2pdf.js.

## Constraints

- Expect small visual differences vs DOCX output.
- Provide a fidelity warning in the UI.
