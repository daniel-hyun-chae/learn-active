# Summary

Implement staging-first environment governance and deployment validation so environment wiring is explicit, localhost redirect targets are limited to local development, and staging auth/deploy configuration is consistently enforced across agentic sessions.

# Implementation Plan

1. Add governance artifacts for environment separation and Supabase auth redirect policy under `.opencode/rules/` and contributor-facing docs.
2. Add automated environment validation script(s) for deploy workflows to enforce non-local URL safety and required secret contracts.
3. Wire validation checks into GitHub Actions staging/production deploy workflows.
4. Add runtime guardrails for web and API configuration to reduce silent misconfiguration in non-local environments.
5. Extend evaluation criteria and integration tests to cover environment governance behavior.
6. Run verification and test suites; record commands and outcomes.

# Task List

- [x] Add governance artifacts for environment and auth redirect policy.
- [x] Add automated deploy environment validation script(s).
- [x] Integrate environment validation into staging and production workflows.
- [x] Add runtime guardrails for non-local environment configuration.
- [x] Extend evaluations and integration tests for new governance behavior.
- [x] Run verification and test suites and record results.

# Tests

- `pnpm test:unit` -> pass (2 passed, 0 failed)
- `pnpm test:integration` -> pass (22 passed, 0 failed)
- `pnpm test:e2e` -> pass (2 passed, 0 failed)
