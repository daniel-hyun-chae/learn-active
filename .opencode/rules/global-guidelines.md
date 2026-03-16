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

## Testing and Spec

- Product behavior is defined in `spec/` files. Each spec file has narrative sections and a Behaviors section with testable assertions.
- Every new feature must add or extend behaviors in the relevant `spec/` file.
- Tests use descriptive names that map to spec behaviors. See `spec/README.md` for the naming convention.
- Architecture-level testing patterns are defined in `.opencode/rules/testing-patterns.md` and applied to all implementations.
- For AI-driven local changes, run the relevant local validation, build, and test commands that cover the same checks expected in CI before work is considered complete.

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
- Every feature domain must have a corresponding spec file: `spec/<domain>.md`.
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
- Spec behaviors added/updated in the relevant `spec/` file for new/changed features.
- Tests use descriptive names that map to spec behaviors per `spec/README.md`.
- Relevant CI-equivalent local validation, build, and test commands were run for the change.
- Decision log entry added if a new library is recommended.
- Architectural documentation updated when core architecture changes.
- Codebase map (`architecture/codebase-map.md`) updated when directories or module-level files are added, removed, or renamed.
- Domain glossary (`architecture/domain-glossary.md`) updated when new domain concepts are introduced or existing definitions change.
- Developer startup guide updated if setup, scripts, ports, or env requirements changed.
- Product-specific gate items satisfied (see `.opencode/rules/product-guidelines.md`).
- Folder placement follows `features/<domain>/` and `shared/` rules.
- Abstractions introduced only with a clear justification.
