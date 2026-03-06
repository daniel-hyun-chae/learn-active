# Learner Course Evaluations

## EVAL-LEARNERS-COURSE-001: Course list and navigation

Goal: Learners can see a course list and start the first lesson.
Criteria:

- The landing experience renders a German course card in web and mobile.
- The course card displays title, description, and language.
- The course card links to or opens the first lesson view.

## EVAL-LEARNERS-COURSE-002: Lesson content flow

Goal: Learners can read lesson content and enter the exercise flow.
Criteria:

- Lesson view renders content blocks for text and image.
- A lesson tab switcher toggles between content and exercise.
- The lesson view shows a “Start exercise” action.
- Lesson content and exercise flows are available in both web and mobile.

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
