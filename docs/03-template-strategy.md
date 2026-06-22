# DOCX Template Strategy

## Template Source

Use the existing DOCX as the base layout.

## Placeholder Rules (draft)

- Simple fields: {{field}}
- Nested fields: {{basicInfo.email}}
- Repeated blocks: {{#experience}}...{{/experience}}
- Conditional blocks: {{#if summary}}...{{/if}}

## Experience Labels

- PT: Responsabilidades Principais, Resultados Chave, Habilidades
- EN: Responsibilities, Key Results, Skills

## Tools (candidates)

- docxtemplater + pizzip
- docx-templates

## Next Step

Convert the DOCX to a placeholder template and verify render fidelity.
