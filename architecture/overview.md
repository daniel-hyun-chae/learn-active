# Learning Platform Architecture Overview

## Overview

This document describes the architecture for the learning platform, including learner-facing experiences (web and mobile), publisher authoring, and the GraphQL API.

## System Context

- Learners access a responsive web app and mobile/tablet app.
- Publishers access the authoring workspace within the web app.
- The API provides GraphQL endpoints for content and quiz data.
- Media assets are stored in object storage and referenced by the API.

## Components

- Web App (TanStack Start): combined learner + publisher experience with /learn and /publish routes, offline quiz attempts, and authoring flows.
- Learners Mobile (Expo React Native): mobile/tablet app with offline quiz attempts and learner course flows.
- GraphQL API (Node + GraphQL Yoga + TypeGraphQL): schema and resolver layer.
- Supabase-managed PostgreSQL + Drizzle ORM: primary data store with application access via `DATABASE_URL`.
- Supabase SQL migrations (`supabase/migrations/*`): authoritative schema evolution workflow.
- Shared packages: design tokens, UI, i18n, config, and utilities.

## Data Flow

- Learners start a quiz attempt; a local draft is persisted offline and later synced.
- Publishers create or update course content (modules, lessons, exercises) via the authoring UI and GraphQL API.
- Web and mobile clients query the API via GraphQL and cache responses.

## Authentication and Identity Flow (Phase 1)

- Supabase Auth is the identity provider for web and mobile clients.
- Supported authentication methods are Google OAuth and magic link only (no email/password UI/flow in this phase).
- Clients bootstrap and restore auth sessions locally and attach bearer tokens to protected API requests.
- API verifies Supabase bearer tokens via JWKS and populates `request.user.id` for protected operations.
- Course GraphQL operations are protected behind reusable auth guard logic.

### Identity data model

- `auth.users` remains managed by Supabase Auth.
- Application-level identity is represented by `public.profiles`.
- `public.profiles.user_id` maps to `auth.users.id`.
- A database trigger auto-syncs new auth users into `public.profiles` (including email) for app-domain usage.

### Deferred to later phases

- Role-based authorization (publisher/learner).
- Organization/workspace ownership model.
- Enterprise SSO integrations.
- Advanced RLS authorization policy design.

## Deployment and Operations

- Local development:

  - Canonical startup is `pnpm db:up` then `pnpm dev`.
  - API runs with local Wrangler Worker emulation.
  - Web runs with Vite dev server.
  - Supabase local stack is used for database and auth dependencies.

- Staging:

  - Deploys automatically from `main` via GitHub Actions.
  - Uses dedicated staging Cloudflare Worker and Pages resources.
  - Uses dedicated staging Supabase project URL and publishable key secrets.

- Production:

  - Deploys manually via GitHub Actions using explicit `commit_ref`.
  - Uses dedicated production Cloudflare Worker and Pages resources.
  - Uses dedicated production Supabase project URL and publishable key secrets.

For detailed deployment, release, and rollback procedures, see `architecture/ci-cd.md`.

## Cross-Cutting Concerns

- Security: enforce auth at API boundaries and protect learner data.
- Accessibility: keyboard and screen reader support in all web UI.
- Localization: all UI copy is sourced from shared i18n resources.

## References

- Decision logs: `decision-log/`
- Product specification: `spec/`
- CI/CD runbook: `architecture/ci-cd.md`
