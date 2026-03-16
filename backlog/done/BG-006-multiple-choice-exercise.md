# BG-006: Multiple-choice exercise end-to-end

Priority: P1
Status: Done
Theme: Content Engine

## Why now

Multiple-choice is the most common exercise format across learning platforms. It is the simplest second type to implement and serves as the first proof that the generic exercise contract (BG-005) actually works. If the abstraction handles both fill-in-the-blank and multiple-choice cleanly, it will handle reordering, matching, and cloze too.

## Scope

- Define the multiple-choice exercise payload: question text, ordered choices (id, text, isCorrect), single-answer or multi-answer flag.
- Implement publisher authoring UI: add/edit/remove choices, mark correct answer(s), reorder choices.
- Implement learner rendering: display question, show choices, accept selection, show immediate feedback.
- Implement server-side grading: validate answer against correct choice(s).
- Add preview support in the publisher workspace.
- Persist and render in both web and mobile.
- Add evaluation criteria in `evaluations/`.

## Out of scope

- Adaptive difficulty or question branching.
- Image-based choices (text-only for v1).
- Randomized choice order (can be added later).

## Dependencies

- BG-005 (exercise type abstraction must be in place first).

## Notes

- The i18n resources already reference `learners.quiz.format.multipleChoice` as a placeholder label, suggesting this was always planned.
- Design question: should a multiple-choice exercise have one step (one question) or support multi-step (series of questions)? Recommend one step per exercise for simplicity, matching the fill-in-the-blank step model.
