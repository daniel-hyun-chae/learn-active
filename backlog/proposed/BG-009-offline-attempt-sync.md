# BG-009: Offline attempt sync

Priority: P2
Status: Proposed
Theme: Learner Experience

## Why now

The platform already has offline scaffolding (the `quizAttemptStore` saves attempts to IndexedDB/AsyncStorage). Once server-side attempt persistence exists (BG-004), locally stored attempts need a sync path so learners can practice offline and have their progress saved when they reconnect.

## What changes

A learner who completes exercises while offline has their attempts stored locally. When connectivity returns, the app automatically syncs pending attempts to the server. The learner sees a sync status indicator so they know whether their offline work has been saved. If the same exercise was attempted both offline and online, the system keeps the most recent or best result.

## Acceptance criteria

- Learner completes an exercise while offline and the attempt is stored locally with a pending sync status.
- When connectivity returns, pending attempts are automatically uploaded to the server.
- Learner sees a sync status indicator showing whether offline attempts have been synced.
- If the same exercise was attempted offline and online, the system resolves the conflict (most recent or best result).
- Submitting the same attempt twice does not create duplicate records on the server.
- Sync works on both web (using connectivity detection) and mobile (using network state).

## Out of scope

- Full offline-first architecture (downloading courses for offline consumption).
- Offline exercise rendering for courses not previously loaded.

## Dependencies

- BG-004

## Notes

The current `quizAttemptStore` schema will need to evolve to match the server attempt model. Idempotency is required -- the same attempt ID submitted twice must not create duplicates.
