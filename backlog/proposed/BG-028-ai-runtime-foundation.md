# BG-028: AI runtime foundation

Priority: P1
Status: Proposed
Theme: Foundation
Spec: spec/platform.md > Environment configuration

## Why now

Multiple planned AI features (contextual tutor, course scaffolding, exercise generation) all need the same infrastructure: calling language models, managing prompts, handling structured output, tracking costs, and logging interactions. Building this as a shared foundation prevents each AI feature from reinventing provider integration, error handling, and observability. Without it, the first AI feature becomes a one-off that the second feature cannot reuse.

## What changes

The platform gains a shared AI runtime layer that any feature can use to make language model calls. The layer handles provider abstraction (so switching between models does not require feature-level changes), structured output parsing (so AI responses reliably match expected schemas), prompt template management (so prompts are versioned and testable), interaction logging (so AI calls are traceable for debugging and cost analysis), and cost/usage tracking (so per-feature and per-user costs are observable). The layer enforces safety guardrails so AI responses stay within the platform's content policy.

## Acceptance criteria

- A shared AI service provides a call interface that features use without direct provider SDK coupling.
- Provider configuration (API keys, model selection, rate limits) comes from environment-scoped secret storage.
- AI calls support structured output with schema validation so responses conform to expected shapes.
- Prompt templates are defined as named, versioned artifacts that can be tested independently.
- Every AI interaction is logged with feature context, token usage, latency, and cost estimate.
- Per-call cost estimates and token usage are tracked from day one, enabling per-feature and per-user cost aggregation.
- The service handles provider errors (rate limits, timeouts, model errors) with retries and clear error propagation.
- AI secrets are never committed to the repository and follow the existing environment variable governance.
- The runtime works in both Node (local dev) and Cloudflare Worker (production) environments.

## Out of scope

- Specific AI features (tutor, scaffolding, generation) -- those are separate items.
- Fine-tuning or training custom models.
- Vector embeddings or semantic search.
- Billing learners or publishers for AI usage.

## Dependencies

- None (foundational infrastructure).

## Notes

See decision log `0009-adopt-vercel-ai-sdk-workers-ai-cloudflare-gateway.md` for full rationale.

Stack: Vercel AI SDK (provider abstraction) + Cloudflare Workers AI (phase 1 zero-cost inference with Llama 3.3 70B) + Cloudflare AI Gateway (caching, rate limiting, logging, fallback routing). Phase 2 upgrades specific features to commercial models (OpenAI GPT-4.1 family, Anthropic Claude, or Google Gemini) by swapping the provider config -- no feature-level code changes.

Prompt templates should live as code files under a shared package so they are versioned, testable, and reviewable. Cost tracking starts as log-based (gateway analytics + application-level logging) and evolves to database-backed when aggregation queries are needed. The Cloudflare AI Gateway is particularly valuable for the tutor: response caching means similar questions about the same exercise from different learners hit cache instead of the model.
