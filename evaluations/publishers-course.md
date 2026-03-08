## EVAL-PUBLISHERS-COURSE-001: Course authoring workflow

Goal: Publishers can author multi-module courses with lessons and fill-in-the-blank exercises.
Criteria:

- The /publish route renders a publisher landing with course cards and a create-course action.
- Entering a course routes to /publish/$courseId and opens the dedicated editor workspace.
- Publishers can add, rename, reorder, and move modules and lessons, plus edit course metadata (title + description only).
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
