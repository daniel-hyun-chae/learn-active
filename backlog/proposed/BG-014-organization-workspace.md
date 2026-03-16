# BG-014: Organization workspace v1

Priority: P3
Status: Proposed
Theme: Organization

## Why now

Not urgent. The database schema already supports `organization` as an owner type in the `owners` table, but no application code provisions or manages organizations. This should only be built after personal ownership is proven, real users exist, and there is concrete demand for shared course management.

## What changes

A publisher can create an organization and manage courses under it. When creating an organization, the publisher provides a name and becomes the initial admin. Courses created under the organization are visible to all organization members based on their role. The organization has a basic settings page where the admin can update the name and description. The admin can invite new members by email, creating a pending membership until the invited user accepts.

## Acceptance criteria

- Publisher creates a new organization with a name.
- The creating publisher is automatically provisioned as the organization admin.
- Publisher creates courses under an organization owner instead of a personal owner.
- Organization members see organization courses based on their role.
- Organization admin accesses a settings page to update the organization name and description.
- Organization admin invites a user by email, which creates a pending membership.
- Invited user accepts the invitation and becomes an organization member.

## Out of scope

- Custom permission matrices (covered by BG-015).
- Organization billing or payment integration.
- Organization-level analytics.
- SSO or SAML for organization login.

## Dependencies

- BG-001 (real database persistence).
- BG-002 (personal ownership must work first).

## Notes

The `owners` table already has the `organization` type and the `owner_members` table supports `owner`, `admin`, `editor`, `viewer` roles. The database foundation exists. Architecture overview explicitly lists organization/workspace ownership model as deferred to later phases. Consider whether organization courses should be transferable between personal and organization ownership.
