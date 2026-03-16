# BG-015: Organization roles and invites

Priority: P3
Status: Proposed
Theme: Organization

## Why now

Not urgent. This extends BG-014 with role management and invitation workflows. Only relevant after organizations exist and have real members.

## What changes

An organization admin can manage the roles and membership of their organization. The admin promotes or demotes members between admin, editor, and viewer roles. The admin can remove members from the organization. Invitations are sent by email; the recipient receives a link to accept and join the organization with a specified role. Pending invitations are visible to the admin and can be cancelled before acceptance. Role-based access is enforced: viewers can see courses but not edit, editors can edit courses but not manage members, admins can do both. All membership changes are recorded in an audit trail.

## Acceptance criteria

- Organization admin promotes or demotes a member between admin, editor, and viewer roles.
- Organization admin removes a member from the organization.
- Organization admin sends an invitation by email with a specified role.
- Invited user receives an email with an acceptance link.
- Invited user accepts the invitation and joins the organization with the specified role.
- Pending invitations are visible to the admin and can be cancelled.
- Role-based access is enforced: viewer sees courses but cannot edit, editor edits courses but cannot manage members, admin can do both.
- Membership changes (invite, role change, removal) are recorded in an audit trail visible to admins.

## Out of scope

- Custom permission templates or fine-grained per-course permissions.
- SCIM provisioning or directory sync.
- Organization-level SSO.

## Dependencies

- BG-014 (organization workspace must exist first).

## Notes

The `owner_members` table already defines roles: `owner`, `admin`, `editor`, `viewer`. The enforcement logic needs to be wired into the repository and resolver layer. Invitation could use Supabase Auth invite or a custom invitation table; custom is more flexible and avoids coupling invitation state to auth state. Consider a decision log entry for the invitation approach.
