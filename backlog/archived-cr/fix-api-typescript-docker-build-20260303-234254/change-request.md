# Summary
Fix API TypeScript build errors blocking Docker builds by adding missing types, updating ESM import extensions, aligning Pothos v4 builder configuration, and correcting enum resolver typing.

# Implementation Plan
1) Add missing API dev dependency for pg types.
2) Update Pothos SchemaBuilder configuration to v4-compatible defaults.
3) Update API relative imports to include .js extensions for NodeNext output.
4) Fix quiz format enum resolver typing.
5) Run unit, integration, and e2e tests.

# Task List
- [x] Add @types/pg to API devDependencies
- [x] Update Pothos SchemaBuilder config for v4 defaults
- [x] Add .js extensions to API relative imports
- [x] Fix quiz format enum resolver typing
- [x] Run unit, integration, and e2e tests

# Tests
- npm run test:unit
- npm run test:integration
- npm run test:e2e
