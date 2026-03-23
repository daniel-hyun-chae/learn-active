# BG-029: Contextual AI tutor

Priority: P1
Status: Proposed
Theme: Learner Experience
Spec: spec/learner-experience.md > Lesson block selection, spec/learner-experience.md > Fill-in-the-blank exercises, spec/learner-experience.md > Discriminated exercise rendering with multiple-choice

## Why now

The platform's core differentiator is AI-native learning. The contextual tutor is the first and most impactful AI feature for learners. Today when a learner gets an answer wrong or doesn't understand lesson content, they have no recourse except re-reading or guessing again. An AI tutor that knows exactly what the learner is studying transforms every exercise and lesson into a personalized learning moment.

## What changes

A learner working through lesson content or exercises can open a tutor conversation scoped to their current context. The tutor knows the course, lesson, content page or exercise the learner is viewing, and (for exercises) what they have answered and whether it was correct. For exercises, the tutor provides hints without giving away the answer, explains why a wrong answer is wrong, and offers related examples. For lesson content, the tutor clarifies difficult passages, provides additional examples, and answers questions about the material. The conversation persists within the session so the learner can ask follow-up questions.

## Acceptance criteria

- Learner sees a tutor action in lesson content view and exercise view.
- Opening the tutor shows a conversation panel with the current content context pre-loaded.
- Tutor responses reference the specific lesson content or exercise the learner is viewing.
- For exercises with a wrong attempt, the tutor explains why the answer was incorrect without revealing the correct answer directly.
- For exercises, the tutor provides hints that guide toward the right thinking.
- For lesson content, the tutor answers questions about the material and provides additional examples.
- The conversation supports follow-up questions within the same session context.
- Tutor interactions are logged for observability and cost tracking.
- Tutor is available on both web and mobile.
- Tutor responses respect the course language (a German course tutor responds with German context and examples).

## Out of scope

- Tutor-initiated conversations (the learner must open the tutor).
- Cross-session conversation history (conversation resets when leaving the context).
- AI conversation as a standalone exercise type.
- Tutor for publisher authoring workflow.

## Dependencies

- BG-028 (AI runtime foundation).

## Notes

The tutor prompt needs careful design to avoid giving away answers while still being helpful. The context window should include: current lesson content or exercise definition, the learner's latest answer (if applicable), and a system prompt establishing the tutor role and boundaries. The conversation panel UX could follow a sidebar pattern similar to the existing structure panel. For language learning specifically, the tutor can provide grammar explanations, usage notes, and cultural context that enrich the static lesson content.

Pricing and limits: tutor is included with enrollment (not a separate purchase). Soft daily limit of ~50 messages per learner per day per course to prevent abuse. Track usage from day one. Cloudflare AI Gateway response caching is especially effective here -- many learners asking similar questions about the same exercise content deduplicate at the API level, reducing cost significantly for popular courses.

Phase 1 model: Llama 3.3 70B via Cloudflare Workers AI (zero cost, adequate for conversational hints and exercise explanations). Phase 2: upgrade to GPT-4.1-mini or Gemini 2.5 Flash when revenue justifies it. See decision log 0009.
