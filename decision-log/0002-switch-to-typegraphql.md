# Switch API schema to TypeGraphQL

Date: 2026-03-04
Status: Accepted

## Context
The initial API scaffold used Pothos, but we need a simpler, decorator-driven approach and better startup reliability. We also want to reduce type mismatch issues that surfaced during Docker builds.

## Decision
Replace Pothos with TypeGraphQL while keeping GraphQL Yoga as the server. Use TypeGraphQL resolvers for health and quiz formats, and enable decorator metadata in the API TypeScript config.

## Consequences
- Requires `reflect-metadata` and decorator metadata enabled in TypeScript.
- Resolvers are class-based and may increase boilerplate for new types.
- Startup becomes more predictable with schema built from resolvers.

## Alternatives Considered
- Pothos with stricter typing (rejected due to ongoing build friction)
- SDL-first schema (rejected due to preference for TS-first)

## Links
- Architecture: `architecture/overview.md`
- Evaluations: `evaluations/portable-startup.md`
