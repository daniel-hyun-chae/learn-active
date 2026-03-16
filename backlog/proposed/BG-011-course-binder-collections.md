# BG-011: Course binder and collections

Priority: P3
Status: Proposed
Theme: Learner Experience

## Why now

Not urgent. This is a learner-side organizational feature that becomes valuable once learners are enrolled in multiple courses and have accumulated progress. It lets learners curate their own study sets by pulling exercises or lessons from different courses into personal collections.

## What changes

A learner can create personal collections to organize exercises and lessons from the courses they are enrolled in. Collections act as custom study lists -- the learner names them, adds items from any enrolled course, reorders items within a collection, and removes items they no longer need. Each collection appears as a focused study view, letting the learner work through curated material without navigating back to the full course. Access is restricted: learners can only add items from courses they are enrolled in.

## Acceptance criteria

- Learner creates a new collection with a title.
- Learner renames or deletes an existing collection.
- Learner adds exercises or lessons from an enrolled course to a collection.
- Learner cannot add items from courses they are not enrolled in.
- Learner views a collection as an ordered study list.
- Learner reorders items within a collection.
- Learner removes individual items from a collection.
- Collections are visible only to the learner who created them.

## Out of scope

- Sharing collections with other learners.
- Publisher-created collections or curated paths.
- Smart or automatic collections based on progress or mistakes.

## Dependencies

- BG-004 (progress data makes collections more meaningful).
- BG-001 (needs real persistence).

## Notes

Collections are a lightweight feature but touching multiple courses requires careful access checks. Consider whether collection items reference exercise IDs (content-blob dependent) or a higher-level lesson or module reference.
