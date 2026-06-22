# Solution Outline

## Core Flow

1. User selects language.
2. User pastes JSON payload.
3. App validates JSON vs schema.
4. App fills DOCX template with JSON.
5. User downloads DOCX and/or PDF.
6. User can copy an AI prompt with JSON examples.

## Modules

- JSON schema + validator
- DOCX template + renderer
- UI flow + download actions
- AI prompt helper (copyable prompt + JSON examples)
- Optional PDF conversion

## Phases

- Phase 1: template analysis + JSON schema
- Phase 2: DOCX templating + front-end UI
- Phase 3: PDF conversion (decision + implementation)
