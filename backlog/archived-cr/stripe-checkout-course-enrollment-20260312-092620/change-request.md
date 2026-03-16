# Summary

Implement a minimal Stripe Checkout purchase flow for paid course enrollment across web and learners-mobile.

Key rules:
- Pricing source of truth is `price_cents` + `currency` + `stripe_price_id`.
- Paid course: `price_cents > 0`; free course: `price_cents` is null or 0.
- Free courses use direct app enrollment (no Stripe).
- Paid courses use Stripe Checkout, and enrollment is created only by verified webhook processing.
- Publisher price updates create a new Stripe Price and update `stripe_price_id`.
- Checkout creation fails when learner is already actively enrolled.
- Checkout creation is allowed only for courses with an active published version.
- Webhook persistence is idempotent/transactional in behavior and only returns success when payment/enrollment state is durably aligned.

# Implementation Plan

1. Add DB and migration changes for pricing and payment audit records.
2. Add Stripe runtime env wiring and Stripe service integration in API.
3. Extend course domain models/repository/types for pricing, payments, checkout, and enrollment status polling.
4. Add GraphQL operations for paid checkout flow, payment history, and enrollment status polling.
5. Add publisher pricing UI and backend validations/invariants.
6. Add web paid/free catalog + detail purchase UX and purchase success pending polling route.
7. Add learners-mobile minimal paid flow (open checkout, deep-link return, pending/poll, My Courses visibility via enrollment).
8. Add webhook endpoint with signature verification and idempotent aligned writes.
9. Add/update evaluation criteria and tests for Stripe purchase/enrollment flow.
10. Run required test suites and record results.

# Task List

- [x] Add pricing fields to course persistence and add payments table with constraints.
- [x] Add Stripe env support and Stripe service client usage in API runtime.
- [x] Implement paid-course provisioning (Stripe Product/Price) and price update behavior (new Price on change).
- [x] Define and enforce a single actively-enrolled rule for repurchase prevention.
- [x] Implement `createCourseCheckoutSession(courseId)` mutation with eligibility checks.
- [x] Implement `myPayments` query.
- [x] Implement enrollment-status polling query for purchase pending screens.
- [x] Implement `POST /api/webhooks/stripe` with signature verification and idempotent payment+enrollment persistence.
- [x] Update web catalog/detail/free-vs-paid CTA behavior.
- [x] Add web `/purchase/success` route with pending + auto-refresh enrollment polling.
- [x] Update publisher UI to configure paid pricing.
- [x] Update learners-mobile flow for deep-link checkout return and pending polling.
- [x] Update shared i18n strings for new user-facing text.
- [x] Add/update evaluation docs under `evaluations/` and wire tests to evaluation IDs.
- [x] Run `pnpm test:unit`.
- [x] Run `pnpm test:integration`.
- [x] Run `pnpm test:e2e`.
- [x] Run `pnpm verify:setup`.
- [x] Run `pnpm smoke:local`.

# Tests

Planned commands:
- pnpm test:unit
- pnpm test:integration
- pnpm test:e2e
- pnpm verify:setup
- pnpm smoke:local

Results:
- `pnpm test:unit` -> PASS (2 passed, 0 failed).
- `pnpm test:integration` -> PASS (27 passed, 0 failed).
- `pnpm test:e2e` -> PASS (smoke + publisher flows passed).
- `pnpm verify:setup` -> PASS.
- `pnpm smoke:local` -> FAIL.
  - Failure: browser-check timed out waiting for `[data-test="api-health"]` on `/learn`.
  - Current `/learn` route is auth-guarded, so unauthenticated smoke browser flow does not render learner home marker.

Re-run after smoke-script updates:
- `pnpm smoke:local` -> PASS.
- `pnpm test:integration` (post-smoke-fix regression) -> PASS (27 passed, 0 failed).
