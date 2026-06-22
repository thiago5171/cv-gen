# JSON Schema (v1)

## Source of truth

- src/data/cv.schema.json

## Required root fields

- name
- basicInfo
- experience
- education

## Optional root fields

- summary
- languages
- certifications
- skills

## Experience requirements (critical)

- responsibilities[] is required and must be an array of strings
- keyResults[] is required and must be an array of strings
- skills[] is required and must be an array of strings

## Notes

- Schema mirrors current DOCX sections and their order.
- Optional fields can be omitted without breaking the layout.
- Update this file if the DOCX inventory changes.
