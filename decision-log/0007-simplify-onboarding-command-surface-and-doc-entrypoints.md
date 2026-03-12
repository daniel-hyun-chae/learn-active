# Simplify onboarding command surface and documentation entry points

Date: 2026-03-09
Status: Accepted

## Context

The repository recently grew in scripts and documentation depth. Human onboarding became harder because local startup, internal helper scripts, and operational runbooks were mixed together in the root README and exposed command surface.

Primary goals for this change were:

- make local startup crystal clear for fresh clone + devcontainer users,
- preserve strong guardrails for agentic development,
- provide clear long-term entry points for architecture and decisions.

## Decision

1. Keep a reduced public command surface in root `package.json`:

- `pnpm dev`
- `pnpm db:up`
- `pnpm db:status`
- `pnpm db:logs`
- `pnpm verify:setup`
- `pnpm smoke:local`
- `pnpm test:unit`
- `pnpm test:integration`
- `pnpm test:e2e`

2. Remove non-essential public aliases from root scripts:

- `verify:startup`
- `browser:check`
- `setup:local`
- `dev:stack`
- `dev:apps`
- `db:push`
- `db:reset`

3. Keep internal behavior unchanged by preserving internal scripts and direct invocation paths (for example `scripts/setup-local.mjs` invoking `scripts/dev-db.mjs push`).

4. Make root `README.md` human-first and concise:

- canonical local/devcontainer startup flow,
- minimal human command set,
- high-level local/staging/production orientation,
- links to deeper technical docs.

5. Move CI/CD operational runbook from `docs/ci-cd.md` to `architecture/ci-cd.md` and treat `architecture/` as the technical documentation entry point.

## Consequences

- First-run onboarding is clearer and faster for human developers.
- Guardrails remain available for agentic and CI usage.
- Internal scripts continue to provide deeper operations without cluttering the primary command surface.
- Tests and evaluations must track the reduced public contract and internal script expectations.

## Alternatives Considered

- Keep all scripts and only hide some from README.
  - Rejected because command discovery remained noisy and confusing.
- Keep CI/CD runbook under `docs/` while simplifying README.
  - Rejected to improve long-term technical navigation by consolidating architecture/operations entry points under `architecture/`.

## Links

- `README.md`
- `architecture/README.md`
- `architecture/overview.md`
- `architecture/ci-cd.md`
- `evaluations/local-startup.md`
- `evaluations/portable-startup.md`
