# Architecture Index

This directory is the technical entry point for humans and AI agents who need to understand how the system works across local development, staging, and production.

## Start here

- System architecture overview: `architecture/overview.md`
- CI/CD, staging/production deploy and rollback runbook: `architecture/ci-cd.md`
- Environment variable and secret scope: `architecture/environment-variables.md`
- OpenCode governance and repo-local agent tooling: `architecture/opencode-governance.md`

## Supporting references

- Implementation decisions (why choices were made): `decision-log/`
- Evaluation criteria and acceptance contracts: `evaluations/`
- Human local quickstart (devcontainer-first): `README.md`

## Maintenance expectations

- Update architecture docs when runtime topology, deployment flow, or platform boundaries change.
- Add or update decision log entries when implementation-affecting decisions are introduced.
- Keep README concise and human-first; keep deeper operational detail in this directory.
