# BG-033: Publisher profile and storefront

Priority: P2
Status: Proposed
Theme: Publisher Tools
Spec: spec/learner-experience.md > Public catalog and enrollment

## Why now

In a marketplace, learners need to know who created a course before they trust it enough to enroll or pay. Today the course detail shows minimal publisher information. A publisher profile creates trust, lets publishers build reputation, and gives learners a way to discover more courses from a publisher they like. This is standard marketplace infrastructure.

## What changes

Each publisher has a public profile page showing their name, bio, optional photo, and a list of their published courses. The profile is linked from course detail pages and course cards in the catalog. Publishers edit their profile from their workspace settings. The profile shows aggregate credibility signals: number of published courses and total enrollment count across all courses.

## Acceptance criteria

- Publisher can edit their profile (display name, bio, photo) from the publisher workspace.
- Each publisher has a public profile page accessible from the catalog.
- Course detail pages and course cards link to the publisher's profile.
- Publisher profile shows all their published courses.
- Publisher profile shows number of published courses and total enrollment count.
- Publisher profile page is accessible to unauthenticated users.
- Profile photo uses a simple upload or URL reference.

## Out of scope

- Publisher verification or badge system.
- Publisher-to-learner messaging.
- Custom profile branding or themes.
- Social media links.

## Dependencies

- None (extends existing profiles and owner model).

## Notes

The existing profiles table has display_name and email. Bio and photo would need additional fields on the profiles or owners table. The publisher profile is effectively a public projection of the owner + profile data. Consider whether the profile is tied to the Profile (person) or the Owner (entity) -- for personal ownership they are the same, but for organizations (BG-014) they would differ. Design the data model to support both.
