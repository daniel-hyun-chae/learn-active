# Adopt Vercel AI SDK, Cloudflare Workers AI, and Cloudflare AI Gateway for LLM integration

Date: 2026-03-23
Status: Proposed

## Context

Multiple AI features are planned for the platform: contextual AI tutor for learners (BG-029), AI course scaffolding for publishers (BG-031), and AI exercise generation for publishers (BG-013). All share the same need: calling language models, parsing structured output, managing prompts, and tracking costs.

The platform runs on Cloudflare Workers in production and Node locally. This edge runtime constraint eliminates SDKs that assume a full Node environment. The platform is pre-revenue, so the initial provider choice must minimize cost while delivering a real, shippable integration that upgrades seamlessly when revenue justifies commercial models.

## Decision

Three layers, each solving a distinct problem:

### 1. Vercel AI SDK -- code abstraction layer

Provider-agnostic TypeScript SDK for calling language models. Features used: structured output with Zod schema validation, streaming responses, tool/function calling. Works in both Node and Cloudflare Worker runtimes. Supports all target providers (Cloudflare Workers AI, OpenAI, Anthropic, Google) through the same interface. Switching providers is a config change, not a rewrite.

### 2. Cloudflare Workers AI -- phase 1 inference provider (zero cost)

Open-source models (Llama 3.3 70B, Mistral) hosted on Cloudflare's network, callable directly from Workers with no external API key and no per-call billing. Included in the existing Workers plan. Quality is sufficient for the tutor (conversational hints, exercise explanations) and adequate for initial scaffolding/generation. Structured output reliability is lower than commercial models but workable with validation and retry.

Phase 2 upgrade path: when usage patterns and revenue justify it, swap specific features to commercial providers (OpenAI GPT-4.1 family, Anthropic Claude, or Google Gemini) by changing the provider config. The Vercel AI SDK abstraction makes this a one-line change per feature.

### 3. Cloudflare AI Gateway -- proxy and observability layer

Sits between the application and inference providers. Provides response caching (critical for tutor -- similar questions about the same exercise from different learners hit cache instead of model), rate limiting, request/response logging, cost analytics, and provider fallback routing. Already part of the Cloudflare ecosystem -- no additional vendor or billing.

### Model-to-feature mapping

| Feature                         | Phase 1 model (zero cost)    | Phase 2 model (paid, when justified) |
| ------------------------------- | ---------------------------- | ------------------------------------ |
| AI tutor (learner)              | Llama 3.3 70B via Workers AI | GPT-4.1-mini or Gemini 2.5 Flash     |
| Course scaffolding (publisher)  | Llama 3.3 70B via Workers AI | GPT-4.1 or Claude Sonnet 4           |
| Exercise generation (publisher) | Llama 3.3 70B via Workers AI | GPT-4.1-mini                         |

### Pricing policy

Phase 1: absorb all AI costs into platform margin. Costs are near-zero with Workers AI.

- Learners: tutor included with enrollment. Soft daily limit (~50 messages/day/course) prevents abuse.
- Publishers: generous free tier (~3 course scaffolds/month, ~30 exercise generations/month). Track all usage from day one.

Phase 2 triggers for paid AI tiers: AI costs exceed 15-20% of platform revenue, or power-user abuse patterns emerge. Until then, AI access is a platform differentiator, not a revenue line.

## Consequences

- Vercel AI SDK adds a dependency but its provider abstraction is the key enabler for the phased approach. If the SDK becomes unmaintained, the fallback is direct provider SDKs with moderate rewrite effort.
- Cloudflare Workers AI model quality is below commercial models for complex structured generation. Course scaffolding quality may be noticeably weaker in phase 1. This is acceptable because publishers review and edit all generated content.
- Cloudflare AI Gateway caching is highly effective for the tutor (many learners, same exercise, similar questions) but less effective for scaffolding (unique inputs per publisher). Tutor cost savings of 60-80% are realistic for popular courses.
- Cost tracking from day one (via gateway analytics + application-level logging) provides the data needed to make informed phase 2 decisions.
- All AI features share the same integration pattern, so the second and third features build faster than the first.

## Alternatives Considered

- **Direct OpenAI SDK**: Simpler but locks to one provider. No zero-cost phase 1. Switching providers later means rewriting call sites.
- **LangChain.js**: Feature-rich (agents, chains, memory, RAG) but extremely heavy for current needs. Questionable edge runtime support. Frequent breaking API changes. Overkill until the platform needs retrieval-augmented generation or multi-step agent workflows.
- **OpenAI as phase 1 provider**: Better quality immediately but adds per-call cost from day one. At pre-revenue stage, even small costs add friction to iteration speed (every test call costs money). Workers AI enables unlimited iteration at zero cost.
- **Google Gemini free tier**: Generous free allowance (1,500 requests/day for Gemini 2.5 Flash). Good middle-ground option between Workers AI and paid OpenAI. Viable as an intermediate step if Workers AI quality proves insufficient before revenue justifies full commercial pricing.
- **No gateway (direct API calls)**: Saves setup time but loses caching, rate limiting, and analytics. Building these in application code is more work and less reliable than the gateway approach.

## Links

- BG-028: AI runtime foundation (shared infrastructure layer)
- BG-029: Contextual AI tutor (first learner-facing AI feature)
- BG-031: AI course scaffolding (first publisher-facing AI feature)
- BG-013: AI draft exercise generation (targeted exercise generation)
- Vercel AI SDK: https://sdk.vercel.ai
- Cloudflare Workers AI: https://developers.cloudflare.com/workers-ai
- Cloudflare AI Gateway: https://developers.cloudflare.com/ai-gateway
