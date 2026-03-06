# Global Guidelines

These rules are the implementation gate for all work in this repo. Treat them as requirements that must be satisfied before work is considered done.

## Frontend
- Frontend must be fully responsive across common breakpoints.
- Use design tokens for all visual values (color, spacing, typography, radius, elevation, motion).
- Add a new token only when a new feature or component needs it and no existing token fits.

## Security
- Security is always considered and baked into all development.
- Prefer least privilege, validate inputs, and avoid exposing secrets or sensitive data in code or logs.

## Accessibility
- Accessibility is always considered and baked into all frontend implementation.
- Ensure semantic structure, keyboard support, focus visibility, and sufficient contrast.

## Testing and Evaluation
- Test directions and acceptance criteria live under `evaluations/` and are the single source of implementation detail.
- Every new feature must add or extend evaluation criteria in `evaluations/`.
- Every test must reference the relevant evaluation criteria using the convention in `evaluations/README.md`.
- Evaluation criteria must be written in a human-readable structure with a high-level goal for each block.

## Decision Logs
- When a new library is recommended for implementation, create a decision log entry under `decision-log/` using the template in `decision-log/README.md`.

## Architecture Evolution
- The agent may recommend architectural evolution (for example, introducing a new service or language when it is a better fit). Mention it explicitly in the conversation and capture it in the decision log if it impacts implementation choices.
- Create or update architectural documentation whenever core architecture changes.
- Architecture documentation lives under `architecture/`.

## Developer Onboarding
- Keep the developer startup guide in `README.md` up to date whenever setup steps, scripts, ports, or required environment variables change.

## Product-Specific Governance
- Product-specific rules live in `.opencode/rules/product-guidelines.md`.

## Structure and Ownership
- Implementation must use feature/domain folders: `features/<domain>/...`.
- Use `shared/` for domain-agnostic, cross-cutting implementations like routing, UI components, design tokens, and translation.
- If an implementation touches multiple domains or becomes foundational, place it in `shared/`.

## Abstraction
- Follow "do not repeat" but avoid premature abstraction.
- Create abstractions only when there is a clear, current reuse case or duplication that harms maintainability.

## Implementation Gate
Before marking work complete, confirm:
- Responsive behavior verified for new/changed frontend UI.
- Design tokens used; any new token justified and added to the shared token system.
- Security and accessibility considerations addressed.
- Evaluation criteria added/updated in `evaluations/` with goal + criteria blocks.
- Tests reference evaluation criteria IDs per `evaluations/README.md`.
- Decision log entry added if a new library is recommended.
- Architectural documentation updated when core architecture changes.
- Developer startup guide updated if setup, scripts, ports, or env requirements changed.
- Product-specific gate items satisfied (see `.opencode/rules/product-guidelines.md`).
- Folder placement follows `features/<domain>/` and `shared/` rules.
- Abstractions introduced only with a clear justification.
