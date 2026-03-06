# Architecture

This directory contains core architecture documentation. Update this documentation whenever core architecture changes.

## Structure
- Keep a high-level overview here and add additional files for detailed diagrams or component docs.
- Link to related decision logs and evaluations when applicable.

## Template
Use this template for the main overview and for any new architecture docs:

```
# <Document Title>

## Overview
<What this architecture covers and why it exists>

## System Context
<Actors, external systems, and trust boundaries>

## Components
- <Component name>: <responsibility and key interfaces>

## Data Flow
- <Key flow 1>
- <Key flow 2>

## Deployment and Operations
<Runtime, hosting, scaling, and observability notes>

## Cross-Cutting Concerns
- Security:
- Accessibility (if frontend):
- Localization:

## References
- Decision logs: `decision-log/`
- Evaluations: `evaluations/`
```
