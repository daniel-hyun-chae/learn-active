# Title

Adopt Wrangler for Cloudflare-compatible API/web local runtime and deploy commands

# Date

2026-03-08

# Status

Accepted

# Context

The platform is being refactored to support Cloudflare deployment while preserving local-first development. The API must run as a Worker-compatible runtime locally, and the web must target Cloudflare Pages static output. Existing startup scripts and tests were tied to Node server boot assumptions.

# Decision

Use Wrangler as the Cloudflare runtime/deploy CLI for both app surfaces:

- API: `wrangler dev` and `wrangler deploy` via `apps/api` scripts.
- Web: `wrangler pages deploy` via `apps/web` scripts for static output.

Keep runtime/domain boundaries portable by restricting Wrangler usage to runtime and deployment layers, not domain/service logic.

# Consequences

- Local API behavior aligns with Worker runtime semantics earlier in development.
- Web deployment assumptions align with static Cloudflare Pages hosting.
- Startup/smoke/test scripts require migration from Node server commands to Wrangler/static preview commands.
- CI/CD remains out of scope for this change but has deterministic commands to adopt later.

# Alternatives Considered

- Keep Node local runtime and defer Wrangler to deployment only: rejected because it would delay compatibility validation and risk runtime drift.
- Use a single root Wrangler config: rejected in favor of per-app ownership and clearer separation.

# Links

- `apps/api/wrangler.jsonc`
- `apps/web/wrangler.jsonc`
- `scripts/dev-stack.mjs`
- `scripts/smoke-local.mjs`
