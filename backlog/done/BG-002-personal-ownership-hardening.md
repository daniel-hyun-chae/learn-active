# BG-002: Personal ownership hardening

Priority: P0
Status: Done
Theme: Foundation

## Why now

The DB schema already defines `owners`, `owner_members`, and `provision_personal_owner()` (migration 0003). The in-memory repository has a minimal stub for `provisionPersonalOwner`. Once BG-001 wires the repository to real Postgres, the ownership provisioning and membership invariants need to work end-to-end against the actual database, including the constraint triggers that enforce personal owner consistency.

## Scope

- Ensure `provisionPersonalOwner` calls the real `public.provision_personal_owner()` SQL function through the wired repository.
- Verify that every authenticated user who creates or manages a course gets a personal owner + owner_members row with role `owner`.
- Confirm publisher CRUD operations resolve ownership from `user_id` / `owner_id`, not email.
- Validate the constraint triggers (`owners_personal_membership_guard`, `owner_members_personal_membership_guard`) fire correctly and reject broken state.
- Confirm legacy migrated courses assigned to the system owner are not surfaced as editable personal publisher courses.

## Out of scope

- Organization owner type provisioning or UI.
- Custom role assignment beyond the auto-provisioned `owner` role.
- RLS policy changes.

## Dependencies

- BG-001 (repository must be wired to real Postgres first).

## Notes

- Evaluation criteria already exist: `EVAL-PUBLISHERS-COURSE-005` covers owner-scoped publisher management access.
- The `owners` table supports `user`, `organization`, and `system` types but only `user` type needs to work in this item.
