# Summary

Add explicit CI visibility and verification for the built web GraphQL endpoint in both staging and production deploy workflows so secret/config updates are observable in logs and incorrect bundled endpoints fail before Cloudflare Pages deploy.

# Implementation Plan

1. Add a script that inspects built web assets, prints detected GraphQL endpoint occurrences, and validates expected endpoint presence.
2. Run the script in staging and production workflows after web build and before Pages deploy.
3. Extend CI/CD integration tests and evaluation criteria to cover endpoint verification wiring.
4. Update CI/CD documentation with the new endpoint verification step.
5. Run unit, integration, and e2e test suites and record outcomes.

# Task List

- [x] Add built web endpoint verification script.
- [x] Integrate endpoint verification into staging and production web deploy jobs.
- [x] Extend tests and evaluation criteria for endpoint verification.
- [x] Update CI/CD docs with endpoint verification behavior.
- [x] Run verification and test suites and record results.

# Tests

- `pnpm test:unit` -> pass (2 passed, 0 failed)
- `pnpm test:integration` -> pass (23 passed, 0 failed)
- `pnpm test:e2e` -> pass (2 passed, 0 failed)
