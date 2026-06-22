# PDF Strategy (Decision: Client-side)

## Option A: Server-side conversion

- Convert DOCX to PDF via a service (ex: LibreOffice).
- Pros: higher fidelity
- Cons: needs backend

## Option B: Client-side conversion (selected)

- Convert in the browser using DOCX render to HTML and PDF export.
- Tools: docx-preview + html2pdf.js
- Pros: no backend
- Cons: lower fidelity, layout risks

## Constraints

- Expect small visual differences vs DOCX output.
- Provide a fidelity warning in the UI.
