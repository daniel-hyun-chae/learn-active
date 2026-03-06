# Summary

Build a structured publishing UI with a left navigation tree for Course > Module > Lesson > Exercise (exercise under lesson). Enable add/rename/delete/reorder/move actions and editing of the selected node in a right panel. Add learner-facing preview modes for full course and selection, showing unsaved edits, and keep explicit save only.

# Implementation Plan

1. Inspect current publisher flow and data model to identify where structural edits and content editing should be implemented.
2. Implement editor state and operations for add/rename/delete/reorder/move across modules, lessons, and exercises.
3. Build the left navigation tree UI with drag-and-drop plus Move To controls, and wire selection state.
4. Build right panel editors for course/module/lesson/exercise fields and content.
5. Implement preview modes (full + selection) using learner-facing rendering with unsaved state.
6. Add explicit save flow to persist edits.
7. Update evaluations, tests, and documentation per guidelines.

# Task List

- [x] Inspect current publisher flow and data model for structure editing entry points.
- [x] Implement editor state and operations for add/rename/delete/reorder/move.
- [x] Build left navigation tree with drag-and-drop and Move To.
- [x] Build right panel editors for selected node types.
- [x] Implement preview modes (full + selection) using unsaved state.
- [x] Add explicit save flow.
- [x] Update evaluations, tests, and documentation.

# Tests

- Not run yet.
