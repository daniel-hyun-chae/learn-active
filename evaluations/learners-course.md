# Learner Course Evaluations

## EVAL-LEARNERS-COURSE-001: Course list and navigation

Goal: Learners can see a course list and start the first lesson.
Criteria:

- The landing experience renders a German course card in web and mobile.
- The course card displays title and description.
- The course card links to or opens the first lesson view.

## EVAL-LEARNERS-COURSE-002: Lesson block selection flow

Goal: Learners can select and view a single lesson block at a time.
Criteria:

- Lesson view renders text/image content blocks for summary and content pages.
- Lesson UI supports three block selection levels: lesson summary, content page, and exercise.
- The main lesson area renders only the selected block (no content/exercise tabs).
- Block-selection behavior is available in both web and mobile lesson views.

## EVAL-LEARNERS-COURSE-003: Fill-in-the-blank exercises

Goal: Learners can complete fill-in-the-blank exercises with typing and options.
Criteria:

- Exercises render one sentence at a time with previous context visible.
- At least one step includes multiple blanks.
- Both typing and options variants are supported.
- Options are clickable and fill the active blank.
- Progress continues only when all blanks are filled.
- Exercise flow supports web and mobile inputs.

## EVAL-LEARNERS-COURSE-004: Dark mode infrastructure

Goal: Ensure the learners web app supports theme switching from the start.
Criteria:

- The web root document includes a `data-theme` attribute.
- The root documents include a `color-scheme` meta tag.

## EVAL-LEARNERS-COURSE-005: Lesson structure navigation

Goal: Learners can navigate module, lesson, and exercise context from a left-side course structure while viewing lesson content.
Criteria:

- The lesson route renders a left-side course structure panel and a content area together on desktop.
- The structure panel is collapsible for responsive layouts and provides a toggle action.
- The structure lists module, lesson summary, content page, and exercise nodes with clear nesting.
- Selecting summary/content page/exercise nodes updates the route selection and lesson view state.
- The selected lesson block is reflected in the main lesson area without additional tab switching.

## EVAL-LEARNERS-COURSE-006: Public catalog and enrollment

Goal: Learners and guests can discover published courses, and authenticated learners can enroll idempotently.
Criteria:

- `/courses` displays only published courses from public catalog query.
- `/courses/$slug` renders published course detail for anonymous and authenticated users.
- Enrollment action requires authentication and uses idempotent behavior (repeat enrollment returns success without duplicates).
- Instructor/owner label uses `profiles.display_name` only when available and is hidden otherwise.

## EVAL-LEARNERS-COURSE-007: My Courses and current published access

Goal: Enrolled learners always access the current published version of a course identity while drafts remain private.
Criteria:

- `/my-courses` lists learner enrollments for current user only.
- Enrollment is unique and idempotent by `(user_id, course_id)` and is not tied to a specific version id.
- Learner course content resolution uses the currently published version for the enrolled course identity.
- Published versions remain available to unenrolled learners through public catalog/detail views.
- Draft and archived versions are not directly exposed in learner/public query paths.
