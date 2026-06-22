# Problem

## Context

The user applies to many roles and must tailor the CV each time.
The manual step of copying AI-generated text into a DOCX template
is the main time sink.

## Goal

Create a front-end app that takes a JSON payload and generates a
CV that keeps the original DOCX layout and branding.

## Constraints

- The DOCX was created in Google Docs; layout must be preserved.
- Input format is JSON; user pastes JSON in the UI.
- Output: DOCX and optional PDF.

## Non-Goals (v1)

- No job-description parsing or AI writing inside the app.
- No multi-template support.
- No user accounts.
