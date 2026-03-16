# Domain Glossary

Precise definitions of domain terms used in the codebase. For architecture and data flow, see `architecture/overview.md`. For where things live, see `architecture/codebase-map.md`.

## Identity and Access

### Profile

Application-level user identity. Maps to `auth.users` via `profiles.user_id`. Auto-created by a database trigger when a Supabase Auth user signs up. Contains display name and email.

### Owner

An entity that owns courses and manages content. Can be a user (personal ownership), organization, or system. Defined in the `owners` table with an `owner_type` discriminator.

### OwnerMember

A membership record linking a Profile to an Owner with a specific role. Roles: `owner`, `admin`, `editor`, `viewer`. Defined in the `owner_members` table.

### Publisher

A role, not a database table. A user acting as a publisher is a Profile who has an OwnerMember relationship with role `owner`, `admin`, or `editor` on an Owner. Publishers create and manage course content through the authoring workspace.

### Learner

A role, not a database table. A user acting as a learner consumes courses, takes exercises, and tracks progress. The learner experience is served by both the web app and the mobile app.

## Course Structure

### Course

The top-level identity container for learning content. Belongs to an Owner. The `courses` table holds identity and metadata only -- actual content lives in CourseVersion.

### CourseVersion

A content snapshot of a Course. Contains the full content tree as a JSONB blob in `course_versions.content`. Has a lifecycle: `draft` -> `published` -> `archived`. Multiple versions can exist per Course; only one can be the live published version at a time.

### CoursePublication

A singleton pointer record per Course that references the currently live CourseVersion. When a publisher publishes a draft, the CoursePublication is updated to point to that version. Defined in the `course_publications` table.

### Module

A top-level grouping within a CourseVersion content tree. Contains Lessons. Stored inside the JSONB content blob, not as a separate database table.

### Lesson

A learning unit within a Module. Contains ContentPages. Stored inside the JSONB content blob.

### ContentPage

A page within a Lesson. Contains an ordered list of ContentBlocks. Stored inside the JSONB content blob.

### ContentBlock

A unit of content within a ContentPage. Can be text, media, or an Exercise reference. Stored inside the JSONB content blob.

## Exercises

### Exercise

A polymorphic interactive assessment within a Lesson. Discriminated by `exerciseType`. Current types: `FILL_IN_THE_BLANK`, `MULTIPLE_CHOICE`. Stored inside the JSONB content blob.

### ExerciseStep

A single step within an Exercise. An Exercise can have multiple steps (for multi-part questions). Contains the prompt and answer structure.

### SentenceSegment

A segment of text within a fill-in-the-blank ExerciseStep. Segments are either plain text or blanks that the learner fills in.

### ExerciseBlank

A blank within a SentenceSegment that the learner must fill. Has an `acceptedAnswers` list for validation.

### MultipleChoiceChoice

A single option in a multiple-choice ExerciseStep. Has a label and a `correct` flag.

## Learner Progress

### Enrollment

A record of a Learner enrolling in a Course. Defined in the `enrollments` table.

### Payment

A payment record associated with an Enrollment. Defined in the `payments` table.

### CheckoutSession

A transient payment session object used during the payment flow. Not persisted as a separate table.

### QuizAttemptDraft

A local-first draft of a learner's exercise attempt. Stored offline on the client (web or mobile) and synced to the server when connectivity allows. Defined in `shared/shared-graphql/` and `shared/shared-utils/`.

### LearnerExerciseAttempt

A server-persisted learner attempt record for a specific exercise in a specific lesson and published course version. Stores normalized answers, correctness, and attempt timestamp in `learner_exercise_attempts`.

### LearnerExerciseAttemptHistory

An append-only timeline of learner attempts for a specific exercise in a lesson and published course version. Stores normalized answers, correctness, and attempt timestamp per submission in `learner_exercise_attempt_history`.

## Maintenance

- Add new terms when a domain concept is introduced in the codebase.
- Update definitions when the meaning or scope of a concept changes.
- Keep definitions precise and reference the storage location (table, JSONB blob, client-side) to reduce ambiguity.
