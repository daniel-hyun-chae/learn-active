# Application Specification

This folder is the single source of truth for what the application does. Each file describes a domain area with narrative context and testable behaviors.

## How to read

Each spec file has two parts:

1. **Narrative sections** -- human-readable descriptions of what the product does in this area. Read these to understand the product.
2. **Behaviors** -- testable assertions listed under `## Behaviors` headings within each section. These are what tests verify.

## How specs are maintained

- When the change-orchestrator completes a feature, it updates the relevant spec file to reflect the new behavior.
- Backlog items include a `Spec:` field pointing to the affected spec section(s).
- Acceptance criteria from backlog items dissolve into spec behaviors after implementation.
- If the spec is inaccurate about current behavior, fix it directly (no backlog item needed).
- If the spec is accurate but behavior should change, create a backlog item.

## Files

| File                     | Domain                                                         |
| ------------------------ | -------------------------------------------------------------- |
| `platform.md`            | Monorepo structure, local startup, Docker, devcontainer, CI/CD |
| `authentication.md`      | Sign-in, identity, session management                          |
| `publisher-authoring.md` | Course creation, content editing, versioning, publishing       |
| `learner-experience.md`  | Catalog browsing, enrollment, lessons, exercises, payments     |

## Relationship to tests

Tests use descriptive names that map to spec behaviors. There is no formal ID system -- the mapping is through clear naming:

- Spec behavior: "Catalog shows all published courses with title, description, and price."
- Test name: `test('catalog shows published courses with title, description, and price')`

The `.opencode/rules/testing-patterns.md` rule provides additional architecture-level test checklists (resolvers, repositories, UI components, auth guards) that apply to all implementations regardless of spec coverage.
