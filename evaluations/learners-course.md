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

## EVAL-LEARNERS-COURSE-008: Paid checkout purchase loop

Goal: Learners can complete a paid purchase flow from catalog/detail into Stripe Checkout and receive enrollment.
Criteria:

- Published paid courses render price and buy CTA in catalog and course detail views.
- Free courses render free labeling and continue using direct enrollment without Stripe.
- Buy CTA creates a Stripe Checkout session and redirects to Stripe-hosted checkout.
- Hosted checkout uses a deterministic card-payment path for the standard learner web flow.
- Checkout metadata carries both `user_id` and `course_id`.

## EVAL-LEARNERS-COURSE-009: Webhook-verified enrollment and idempotency

Goal: Enrollment for paid courses is created only through verified Stripe webhook processing and remains idempotent.
Criteria:

- Webhook endpoint verifies Stripe signature before accepting checkout completion events.
- Successful paid checkout records a payment audit entry and creates learner enrollment.
- Checkout completion supports both immediate paid completion and async payment success events.
- Duplicate webhook delivery does not create duplicate payments or duplicate enrollments.
- Checkout session creation is blocked for actively enrolled learners.

## EVAL-LEARNERS-COURSE-010: Purchase pending UX and mobile deep-link return

Goal: Learners receive clear purchase-pending feedback while enrollment sync completes on web and mobile.
Criteria:

- Web purchase success route shows pending state and polls enrollment status by course.
- Mobile purchase flow returns via deep link and polls enrollment status by course.
- Mobile auth redirect handling ignores non-auth purchase deep links.
- Once enrollment is confirmed, learners can access the course from My Courses / learner home flow.
