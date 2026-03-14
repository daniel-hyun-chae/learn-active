## EVAL-PUBLISHERS-COURSE-001: Course authoring workflow

Goal: Publishers can author multi-module courses with lessons and fill-in-the-blank exercises.
Criteria:

- The /publish route renders a publisher landing with course cards and a create-course action.
- Entering a course routes to /publish/$courseId and opens the dedicated editor workspace.
- Publishers can add, rename, reorder, and move modules and lessons, plus edit course metadata (title + description + pricing).
- Lesson content uses a rich text editor powered by Lexical.
- Lessons support summary content and content pages as separate selectable authoring levels.
- Fill-in-the-blank builder supports [blank] templates with per-blank typing or options configuration.
- Publishers can trigger a seed action to restore the sample course.
- Publishers can preview the learner experience for the full course or the selected section with unsaved edits.

## EVAL-PUBLISHERS-COURSE-002: Publisher persistence and structure management

Goal: Publisher structure edits persist and remain operable across reloads.
Criteria:

- Publishers can create a new course from landing and save course metadata.
- Publishers can add modules, lessons, content pages, and exercises and update their fields.
- Publishers can reorder modules, lessons, content pages, and exercises.
- Up/down movement crosses boundaries for lessons (across modules) and exercises (across lessons).
- Saved changes persist after returning through landing and re-entering the course editor.

## EVAL-PUBLISHERS-COURSE-003: Parallel three-column authoring workspace

Goal: Publishers can author with synchronized structure, designer, and preview panels visible together.
Criteria:

- The /publish/$courseId workspace renders Structure, Designer, and Preview in an always-parallel three-column layout.
- There is no global full parallel toggle.
- Each column has an independent expand/collapse action and collapses into a 48px rail.
- The structure column does not over-grow and designer/preview receive most flexible growth.
- The workspace avoids normal horizontal scrolling in standard desktop usage.
- Selection from the structure tree synchronizes both designer context and preview output.
- Preview content follows selection granularity: course shows full course, module shows module lessons, lesson shows lesson, content page shows content page, exercise shows exercise.
- The structure tree remains operable for add, move up/down, and delete actions.

## EVAL-PUBLISHERS-COURSE-004: Compact explorer-style structure tree

Goal: Publishers can scan and edit nested course structure quickly with a compact explorer-like tree.
Criteria:

- Tree rows are visually compact and preserve readable hierarchy with indentation and nesting cues.
- Module, lesson, content page, and exercise row actions are shown as side affordances.
- Add, move up/down, and delete interactions remain available at each relevant level.

## EVAL-PUBLISHERS-COURSE-005: Owner-scoped publisher management access

Goal: Publisher management access is owner-scoped, while learner-facing course reads remain a separate policy concern.
Criteria:

- Publisher landing and editor routes query owner-scoped fields for management access (`publisherCourses`, `publisherCourse`).
- Learner routes query learner-facing fields (`learnerCourses`, `learnerCourse`) and do not rely on publisher ownership fields.
- Existing compatibility aliases can remain, but publisher CRUD operations resolve ownership from authenticated user id, not email.
- Ownership provisioning for authenticated users is idempotent and enforces personal owner membership invariants.
- Legacy migrated courses assigned to the reserved system owner are treated as learner-facing/system content and are not surfaced as editable personal publisher courses by default.

## EVAL-PUBLISHERS-COURSE-006: Draft versioning and publish workflow

Goal: Publishers can evolve course content through internal versions with history, compare, publish, and rollback-as-new-version.
Criteria:

- Publisher save operations update a draft version tied to course identity and owner scope.
- Publishing promotes the active draft to the published version and updates publication projection.
- Publishing archives the previously published version and keeps exactly one active published version per course.
- Creating a new draft from published content auto-assigns the next system-managed version number.
- Version history is available with metadata for each version (version number, status, created/published timestamps, author, and change note).
- Compare supports a structured diff summary for content fields (added, removed, changed) and title/description change flags.
- Rollback is implemented as restore-as-draft from an older version, then publish as a new next version (history is never rewritten).
- Publisher create/edit/publish operations are available only to owner members with manage roles.
- Public catalog and learner flows never expose unpublished draft versions.

## EVAL-PUBLISHERS-COURSE-007: Paid pricing configuration and Stripe price mapping

Goal: Publishers can configure paid pricing with stable invariants, and price updates create a new Stripe Price mapping.
Criteria:

- Course editor exposes a pricing control with EUR-only scope for this phase.
- Blank or zero price config is treated as free, and positive `price_cents` is treated as paid only when it satisfies the Stripe minimum charge for EUR (`>= 50`).
- Saving a paid course provisions a Stripe Price and persists `stripe_price_id`.
- Updating a paid course price creates a new Stripe Price and updates course mapping to the latest `stripe_price_id`.
- Free-course saves clear paid mapping in course state so free enrollment does not require Stripe checkout.
- Local paid-course saves work in `APP_ENV=local` without manually copying a fresh Stripe CLI webhook secret when local Stripe CLI auto-start is enabled.
