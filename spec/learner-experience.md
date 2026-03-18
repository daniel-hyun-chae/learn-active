# Learner Experience

Catalog browsing, enrollment, lesson navigation, exercises, and payments. Learners access courses through both the web app and mobile app.

## Course list and navigation

Learners see a course list and can start the first lesson.

### Behaviors

- Landing experience renders a course card in web and mobile.
- Course card displays title and description.
- Course card links to or opens the first lesson view.

## Lesson block selection

Learners select and view a single lesson block at a time.

### Behaviors

- Lesson view renders text/image content blocks for summary and content pages.
- Lesson UI supports three block selection levels: lesson summary, content page, and exercise.
- Main lesson area renders only the selected block.
- Block-selection behavior is available in both web and mobile lesson views.

## Lesson structure navigation

Learners navigate module, lesson, and exercise context from a left-side course structure.

### Behaviors

- Lesson route renders a left-side course structure panel and a content area on desktop.
- Structure panel is collapsible for responsive layouts with a toggle action.
- Structure lists module, lesson summary, content page, and exercise nodes with clear nesting.
- Selecting nodes updates the route selection and lesson view state.
- Selected lesson block is reflected in the main lesson area without additional tab switching.

## Fill-in-the-blank exercises

Learners complete fill-in-the-blank exercises with typing and options.

### Behaviors

- Exercises render one sentence at a time with previous context visible.
- At least one step includes multiple blanks.
- Both typing and options variants are supported.
- Options are clickable and fill the active blank.
- Progress continues only when all blanks are filled.
- Final-step submission shows correctness feedback after learner answers are saved.
- Exercise flow supports web and mobile inputs.

## Discriminated exercise rendering with multiple-choice

Learner web and mobile render exercises via type-dispatched components and support multiple-choice.

### Behaviors

- Learner exercise payload uses discriminated fields (fillInBlank, multipleChoice) under Exercise.type.
- Fill-in-the-blank rendering continues to work using fillInBlank.steps.
- Multiple-choice rendering is available in both web and mobile lesson flows.
- Multiple-choice supports single-select and multi-select based on allowsMultiple.
- Learner UI provides immediate local correctness feedback for multiple-choice selections.
- Multiple-choice submission synchronizes with backend attempt persistence so lesson/course progress and attempt history reflect submitted answers.

## Public catalog and enrollment

Learners and guests discover published courses. Authenticated learners can enroll idempotently.

### Behaviors

- `/courses` displays only published courses from public catalog query.
- `/courses/$slug` renders published course detail for anonymous and authenticated users.
- Enrollment action requires authentication and uses idempotent behavior.
- Instructor/owner label uses profiles.display_name only when available.

## My Courses and published access

Enrolled learners always access the current published version. Drafts remain private.

### Behaviors

- `/my-courses` lists learner enrollments for current user only.
- Learner-facing clients use learnerCourses/learnerCourse and not compatibility aliases.
- Enrollment is unique and idempotent by (user_id, course_id) and not tied to a specific version.
- Learner course content uses the currently published version for the enrolled course identity.
- Published versions remain available to unenrolled learners through public catalog/detail views.
- Draft and archived versions are not exposed in learner/public query paths.

## Paid checkout

Learners complete a paid purchase flow from catalog/detail into Stripe Checkout and receive enrollment.

### Behaviors

- Published paid courses render price and buy CTA in catalog and course detail views.
- Free courses render free labeling and use direct enrollment without Stripe.
- Buy CTA creates a Stripe Checkout session and redirects to Stripe-hosted checkout.
- Hosted checkout uses a deterministic card-payment path for the standard web flow.
- Checkout metadata carries both user_id and course_id.

## Webhook-verified enrollment

Enrollment for paid courses is created through verified Stripe webhook processing and remains idempotent.

### Behaviors

- Webhook endpoint verifies Stripe signature before accepting checkout completion events.
- Successful paid checkout records a payment audit entry and creates learner enrollment.
- Checkout completion supports both immediate paid completion and async payment success events.
- Duplicate webhook delivery does not create duplicate payments or enrollments.
- Checkout session creation is blocked for actively enrolled learners.

## Purchase pending UX and mobile return

Learners receive purchase-pending feedback while enrollment sync completes.

### Behaviors

- Web purchase success route shows pending state and polls enrollment status by course.
- Mobile purchase flow returns via deep link and polls enrollment status.
- Mobile auth redirect handling ignores non-auth purchase deep links.
- Once enrollment is confirmed, learners can access the course from My Courses.

## Learner attempt persistence and progress visibility

Learner attempts are stored server-side against the active published course version, and progress is visible at lesson and course/module levels.

### Behaviors

- Submitting a learner exercise attempt persists answers and correctness for the current learner and course version.
- If attempt submission fails, learner sees actionable submission error feedback and no silent success state.
- Lesson view displays progress as completed exercises out of total exercises for the selected lesson.
- Course structure displays module-level completion percent and per-exercise attempt status.
- Learner home course cards display course-level completed exercises out of total exercises.
- Learner attempt records are scoped to a specific course version and keep stable exercise references.
- Learner course detail and learner attempt/progress operations require active enrollment for the authenticated learner.
- Each learner attempt submission appends a history entry while also updating latest-attempt status used by progress summaries.

## Wrong-answer review mode and attempt timeline

Learners can focus on mistakes from the normal lesson view and inspect all attempt history for each exercise.

### Behaviors

- Learner can toggle review mode in lesson view, and mode state persists in URL search.
- Review mode shows only exercises where latest attempt is incorrect, nested under original module and lesson.
- Modules and lessons without latest-wrong exercises are hidden in review mode.
- Review mode highlights wrong exercises and shows pending wrong-exercise count for current course.
- Retrying a wrong exercise and submitting a correct answer removes it from review mode immediately after refresh.
- Learner can open exercise attempt timeline from structure row action.
- Attempt timeline displays all attempts chronologically with correctness status and timestamp.
- Attempt timeline is scoped to current learner, course, version, lesson, and exercise.
