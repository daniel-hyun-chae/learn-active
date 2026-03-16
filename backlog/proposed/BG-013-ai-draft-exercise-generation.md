# BG-013: AI draft exercise generation

Priority: P3
Status: Proposed
Theme: Content Engine

## Why now

Not urgent. AI-assisted exercise generation is a compelling authoring accelerator but requires a stable, validated exercise schema to generate into. Building this before the exercise type system is settled means the AI output format will need to change, creating rework.

## What changes

A publisher can trigger AI-powered exercise generation from the authoring workspace. The publisher selects a lesson or topic, chooses an exercise type (fill-in-the-blank or multiple-choice), and requests a number of exercises. The system generates draft exercises using an LLM and inserts them into the course editor, clearly marked as AI-generated. The publisher must review, edit, and explicitly approve each generated exercise before it becomes part of the published course content. No AI-generated content reaches learners without human review.

## Acceptance criteria

- Publisher selects a lesson or topic and requests a specified number of exercises of a chosen type.
- System generates draft exercises and inserts them into the course editor.
- Generated exercises are visually marked as AI-generated in the authoring workspace.
- Publisher can edit, approve, or discard each generated exercise individually.
- No AI-generated exercise is included in a published course version without explicit publisher approval.
- Fill-in-the-blank and multiple-choice exercise types are supported for generation.
- LLM API keys are managed through environment-scoped secret storage and are never committed to the repository.

## Out of scope

- Automatic publishing of AI-generated content.
- Learner-facing AI features (adaptive hints, chatbot tutoring).
- Fine-tuning or training custom models.
- Cost management or usage quotas.

## Dependencies

- BG-005 (exercise type abstraction must be settled so generated exercises match the schema).
- BG-006 (at least two exercise types should exist to make generation useful).

## Notes

Requires a decision log entry for the chosen LLM provider and integration approach. Consider rate limiting and cost visibility for publishers.
