## Summary

- Add a left-side course structure navigation panel in Learning mode so learners can view and select module/lesson/exercise while reading content.
- Refactor Publish experience to a persistent three-column layout (Structure, Designer, Preview) with independent expand/collapse controls per column and synchronized selection across all columns.
- Improve the course structure editor to be compact and explorer-like with clearer nesting, thinner rows, side action icons, and support for both drag-and-drop and up/down controls.

## Implementation Plan

1. Identify and update learning and publish layout containers to support the new navigation and persistent three-column behavior.
2. Implement responsive/collapsible left structure panel in Learning mode (visible by default on desktop).
3. Replace publish mode toggles with independent column collapse/expand controls and default expanded state.
4. Centralize selected entity state and wire it so structure selection always drives both editor and preview.
5. Redesign structure tree row UI for compact explorer-like hierarchy and action affordances.
6. Add drag-and-drop reordering while preserving up/down/remove controls.
7. Add/update evaluation criteria under evaluations/ and ensure tests reference criteria IDs.
8. Run unit, integration, and e2e tests with repo defaults and record results.

## Task List

- [x] Identify relevant learning/publish layout and state files
- [x] Implement Learning mode left course structure navigation (desktop default + responsive collapse)
- [x] Refactor Publish to always-on three-column layout
- [x] Add independent expand/collapse controls for Structure, Designer, Preview columns
- [x] Implement synchronized selection from structure to both designer and preview
- [x] Redesign structure editor to compact explorer-like style (thinner rows, clearer nesting, side icons)
- [x] Add drag-and-drop support while retaining up/down/remove actions
- [x] Update evaluations criteria and references for this feature
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Run e2e tests

## Tests

- Pending implementation.
