Summary
- Implement BG-005 and BG-006 together by introducing a discriminated union exercise model (fill-in-the-blank and multiple-choice) across API, publisher authoring, web learner rendering, and mobile learner rendering.
- Keep BG-004 skipped by deferring grading/persistence changes, while ensuring the new content model is backward-compatible and continuable for future exercise types.

Implementation Plan
- Refactor API course exercise GraphQL/input/domain types to discriminated union payloads with `FILL_IN_THE_BLANK` and `MULTIPLE_CHOICE`.
- Add backward-compatible normalization so existing fill-in-the-blank content is preserved under the new structure.
- Update publisher types/utils and authoring UI to support both exercise types, including one-step multiple-choice authoring with choice ordering and correct-flag editing.
- Update learner web/mobile exercise rendering to dispatch by type and support multiple-choice interactions.
- Update seed content and route queries as needed for the new exercise shape.
- Update evaluations, tests, and backlog statuses for BG-005/BG-006.
- Run unit, integration, and e2e tests and capture results.

Task List
- [ ] Refactor API exercise domain and GraphQL types to discriminated union content.
- [ ] Add backward-compatible normalization for legacy fill-in-the-blank inputs.
- [ ] Update publisher types/utils for multi-type exercise authoring payloads.
- [ ] Implement publisher multiple-choice editor and preview support.
- [ ] Implement learner web multiple-choice renderer with type switch.
- [ ] Implement learner mobile multiple-choice renderer with type switch.
- [ ] Update evaluations and tests for BG-005/BG-006 expectations.
- [ ] Update backlog statuses for BG-005 and BG-006.
- [ ] Run test:unit and record result.
- [ ] Run test:integration and record result.
- [ ] Run test:e2e and record result.

Tests
- Pending implementation.
