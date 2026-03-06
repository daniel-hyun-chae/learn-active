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
- Postgres + Drizzle: primary data store and migrations.
- Shared packages: design tokens, UI, i18n, config, and utilities.

## Data Flow

- Learners start a quiz attempt; a local draft is persisted offline and later synced.
- Publishers create or update course content (modules, lessons, exercises) via the authoring UI and GraphQL API.
- Web and mobile clients query the API via GraphQL and cache responses.

## Deployment and Operations

- The web app is built and deployed as a single service.
- Mobile app ships via platform stores with OTA updates where possible.
- API runs as a standalone service with Postgres.

## Cross-Cutting Concerns

- Security: enforce auth at API boundaries and protect learner data.
- Accessibility: keyboard and screen reader support in all web UI.
- Localization: all UI copy is sourced from shared i18n resources.

## References

- Decision logs: `decision-log/`
- Evaluations: `evaluations/platform-initialization.md`
