## Summary

Make the local dev cleanup command reliably free the API and web ports so `pnpm dev` can restart without manual process hunting after interrupted local runs.

## Implementation Plan

1. Inspect the current cleanup behavior and identify why the API or web process survives cleanup.
2. Update the cleanup script to terminate both known process patterns and any process currently bound to the standard dev ports.
3. Validate that cleanup frees the ports and that `pnpm dev` can start successfully afterward.
4. Record the results and any follow-up notes.

## Task List

- [x] Inspect the current cleanup behavior and surviving process path.
- [x] Harden cleanup to terminate port owners reliably.
- [x] Validate `pnpm dev:cleanup` followed by `pnpm dev`.
- [x] Record outcomes and follow-up notes.

## Tests

- `pnpm dev:cleanup` -> PASS
- Port probe on `4000` and `4100` after cleanup -> PASS
- `timeout 120s pnpm dev` -> PASS (dev stack started cleanly and both services responded)

## Notes

- The original cleanup script only matched a few parent command strings, which missed surviving `workerd` listeners that continued owning port `4000` after the parent process exited.
- Cleanup now targets both known dev command patterns and any process still bound to the standard dev ports, which fixes the orphaned `workerd` case.
- The cleanup script now avoids terminating itself while still killing matching child or detached port-owner processes.
