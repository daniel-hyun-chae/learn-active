# Publisher Authoring

Course creation, content editing, versioning, publishing, and pricing. Publishers access the authoring workspace within the web app at `/publish`.

## Course authoring workflow

Publishers create multi-module courses with lessons and exercises. The `/publish` route shows a publisher landing with course cards and a create-course action. Entering a course opens a dedicated editor workspace with structure, designer, and preview panels.

### Behaviors

- `/publish` renders a publisher landing with course cards and a create-course action.
- Entering a course routes to `/publish/$courseId` and opens the editor workspace.
- Publishers can add, rename, reorder, and move modules and lessons, plus edit course metadata (title, description, pricing).
- Lesson content uses a rich text editor powered by Lexical.
- Lessons support summary content and content pages as separate selectable authoring levels.
- Fill-in-the-blank builder supports [blank] templates with per-blank typing or options configuration.
- Publishers can trigger a seed action to restore the sample course.
- Publishers can preview the learner experience for the full course or the selected section with unsaved edits.

## Persistence and structure management

Publisher structure edits persist across reloads. Publishers can create courses, add modules, lessons, content pages, and exercises.

### Behaviors

- Publishers can create a new course from landing and save course metadata.
- Publishers can add modules, lessons, content pages, and exercises and update their fields.
- Publishers can reorder modules, lessons, content pages, and exercises.
- Up/down movement crosses boundaries for lessons (across modules) and exercises (across lessons).
- Saved changes persist after returning through landing and re-entering the course editor.

## Three-column authoring workspace

The editor workspace renders Structure, Designer, and Preview in an always-parallel three-column layout. Each column has an independent expand/collapse action.

### Behaviors

- `/publish/$courseId` workspace renders Structure, Designer, and Preview in parallel three-column layout.
- Each column has an independent expand/collapse action and collapses into a 48px rail.
- Structure column does not over-grow; designer/preview receive most flexible growth.
- Selection from structure tree synchronizes designer context and preview output.
- Preview follows selection granularity: course shows full course, module shows module lessons, lesson shows lesson, content page shows content page, exercise shows exercise.

## Compact structure tree

Publishers scan and edit nested course structure with a compact explorer-like tree.

### Behaviors

- Tree rows are visually compact with indentation and nesting cues.
- Module, lesson, content page, and exercise row actions are shown as side affordances.
- Add, move up/down, and delete interactions remain available at each relevant level.

## Owner-scoped access

Publisher management access is owner-scoped. Learner-facing course reads are a separate concern.

### Behaviors

- Publisher landing and editor query owner-scoped fields for management access.
- Learner routes query learner-facing fields and do not rely on publisher ownership fields.
- Publisher CRUD operations resolve ownership from authenticated user id.
- Ownership provisioning is idempotent.
- Personal ownership invariants are enforced by database constraint triggers.
- Legacy migrated courses assigned to system owner are not surfaced as editable personal publisher courses.

## Draft versioning and publish workflow

Publishers evolve course content through internal versions with history, compare, publish, and rollback.

### Behaviors

- Publisher save operations update a draft version tied to course identity and owner scope.
- Publishing promotes the active draft to the published version and updates publication projection.
- Publishing archives the previously published version; exactly one published version exists per course.
- Creating a new draft from published content auto-assigns the next version number.
- Version history is available with metadata (version number, status, timestamps, author, change note).
- Compare supports a structured diff summary for content fields.
- Rollback is restore-as-draft from an older version then publish as new version; history is never rewritten.
- Publisher create/edit/publish operations are available only to owner members with manage roles.
- Public catalog and learner flows never expose unpublished draft versions.

## Paid pricing and Stripe integration

Publishers configure paid pricing with stable invariants. Price updates create new Stripe Price mappings.

### Behaviors

- Course editor exposes a pricing control with EUR-only scope.
- Blank or zero price is treated as free; positive price_cents >= 50 (EUR Stripe minimum) is treated as paid.
- Saving a paid course provisions a Stripe Price and persists stripe_price_id.
- Updating price creates a new Stripe Price and updates the course mapping.
- Free-course saves clear paid mapping so free enrollment skips Stripe checkout.
- Local paid-course saves work without manually copying Stripe CLI webhook secret when auto-start is enabled.

## Runtime repository persistence

Node and worker runtimes use real database-backed repository adapters by default.

### Behaviors

- Node runtime uses real Postgres persistence.
- Worker runtime uses Supabase service-role persistence.
- Runtime service initialization fails fast when required configuration is missing.
- Local dev and e2e startup provide worker runtime SUPABASE_SERVICE_ROLE_KEY.

## Exercise type abstraction and multiple-choice authoring

Publisher authoring supports a discriminated exercise model with multiple types.

### Behaviors

- Exercise authoring uses explicit type discriminator (FILL_IN_THE_BLANK, MULTIPLE_CHOICE) with type-specific payload fields.
- Fill-in-the-blank content is stored under fillInBlank.steps and editable through template and blank controls.
- Multiple-choice content is stored under multipleChoice with question, allowsMultiple, and ordered choices.
- Publisher exercise editor includes type switching and preserves valid type-specific defaults.
- Multiple-choice authoring supports add, edit, reorder, and delete choices plus correct-choice toggling.
- Publisher preview renders exercise output based on selected exercise type.
