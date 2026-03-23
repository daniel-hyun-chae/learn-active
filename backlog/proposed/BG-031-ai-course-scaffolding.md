# BG-031: AI course scaffolding

Priority: P1
Status: Proposed
Theme: Content Engine
Spec: spec/publisher-authoring.md > Course authoring workflow

## Why now

The platform's publisher acquisition story depends on making course creation dramatically faster than alternatives. Today a publisher manually creates every module, lesson, content page, and exercise. For an independent teacher, this is hours of work before they have anything publishable. AI-assisted scaffolding lets a publisher go from topic to reviewable draft in minutes, making the platform compelling enough to choose over simpler alternatives.

## What changes

A publisher starting a new course can provide a topic, target audience, and optionally a rough outline or learning objectives. The system generates a full course draft including module structure, lesson titles and content, content pages, and exercises of appropriate types. The generated draft appears in the normal course editor where the publisher has full authoring control to review, edit, rearrange, add, or remove any generated content. Generated content is clearly marked as AI-generated until the publisher edits it. The publisher can also select an existing lesson and request additional exercises or content for that specific section.

## Acceptance criteria

- Publisher initiates AI scaffolding from the course creation flow or from an empty course.
- Publisher provides topic and target audience; optionally provides outline or learning objectives.
- System generates a complete course draft with modules, lessons, content, and exercises.
- Generated draft uses the existing course content schema and appears in the standard editor.
- Generated exercises use supported exercise types (fill-in-the-blank, multiple-choice).
- Publisher can edit, rearrange, add, or delete any generated content in the editor.
- Generated content is visually marked as AI-generated until the publisher modifies it.
- Publisher can request additional content or exercises for a specific lesson from within the editor.
- Generation provides progress feedback (not a silent spinner for long operations).
- Generated courses pass publisher validation rules before publishing.

## Out of scope

- AI-generated media (images, audio, video).
- Automatic publishing of generated content without publisher review.
- Learning from publisher editing patterns to improve future generation.
- Generating content in languages the publisher did not specify.

## Dependencies

- BG-028 (AI runtime foundation).

## Notes

This partially overlaps with BG-013 (AI draft exercise generation). BG-013 is specifically about exercise generation within an existing lesson. This item is broader: full course structure generation. Once this is built, BG-013's scope may be covered or reduced to incremental refinements. The generation prompt needs the full course content schema as context so the output is structurally valid. Consider a two-step generation (structure first, then content per lesson) to keep individual AI calls manageable and allow publisher review between steps.

Pricing and limits: publishers get a generous free tier (~3 course scaffolds/month, ~30 exercise generations/month for the in-editor generation path). Track usage from day one. Revisit paid tiers when AI costs exceed 15-20% of platform revenue or clear power-user patterns emerge.

Phase 1 model: Llama 3.3 70B via Cloudflare Workers AI (zero cost). Structured output reliability is lower than commercial models; compensate with validation and retry. Phase 2: upgrade to GPT-4.1 or Claude Sonnet 4 for paid publishers who need higher quality and higher volume (~30 scaffolds/month). See decision log 0009.
