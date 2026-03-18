# Testing Patterns

Architecture-level test checklists applied to every implementation. These complement the domain-specific behaviors in `spec/` by ensuring consistent coverage of structural patterns regardless of feature area.

## API Resolvers

Every GraphQL resolver implementation must be tested for:

- Authenticated happy path returns expected data shape.
- Missing auth token returns authentication error.
- Invalid/expired auth token returns authentication error.
- Not-found input returns null or appropriate error (not a crash).
- Invalid input returns validation error with actionable message.
- Wrong user/role returns authorization error (when authorization applies).

## Repository Functions

Every database repository function must be tested for:

- Happy path returns correct data for valid input.
- Not-found returns null or empty collection (not an exception).
- Constraint violation (duplicate key, FK violation) returns a meaningful error.
- Filters and pagination return correct subsets when applicable.

When multiple runtime-specific repository implementations exist for the same contract (for example Node/Postgres and Worker/Supabase), tests must validate behavioral parity for critical user flows, not just wiring.

## Learner Attempt and Progression Flows

Every learner attempt/progression implementation must be tested for:

- Attempt submission persists latest attempt status and append-only attempt history.
- Progress summaries update after submission for lesson/module/course aggregates.
- Learner course detail and attempt/progress operations are enrollment-gated for the authenticated learner.
- Non-enrolled learner attempt submission is rejected with clear authorization or availability error.
- Runtime parity holds across repository implementations for submission, history, and progress behavior.

## UI Components (Interactive)

Every interactive UI component must be tested for:

- Renders with required props without errors.
- User interaction (click, input, select) triggers expected state change or callback.
- Loading state renders correctly.
- Error state renders correctly with actionable message.
- Keyboard interaction works for primary actions (Enter, Escape, Tab).
- Component is accessible (has appropriate ARIA attributes, labels).

## Auth Guards and Middleware

Every auth guard or middleware must be tested for:

- Valid token passes through and populates user context.
- Expired token is rejected with clear error.
- Missing token is rejected with clear error.
- Malformed token is rejected without crashing.
- Insufficient role/permission is rejected (when role-based access applies).

## Data Migrations

Every database migration must be verified for:

- Applies cleanly on a fresh database (forward migration).
- Applies cleanly on existing data (incremental migration).
- Reversible if the migration includes a down step.
- Does not break existing application queries (backward compatibility within release window).

## When to Apply

- Apply the relevant checklist whenever implementing or modifying a component that matches a category above.
- Not every item applies to every component -- use judgment. A read-only resolver does not need a "wrong user" test if there is no authorization layer yet.
- These patterns are additive to spec behaviors. A feature's spec behaviors test "what the product does"; these patterns test "how the architecture holds up."
