# BG-030: Marketplace catalog discovery

Priority: P1
Status: Done
Theme: Learner Experience
Spec: spec/learner-experience.md > Public catalog and enrollment

## Why now

The platform operates as a marketplace where learners discover courses from many publishers. The current catalog is a flat list of published courses with title and description. Without search, filtering, categories, or course previews, learners cannot effectively find courses that match their interests. This is baseline marketplace infrastructure that must exist before publisher acquisition makes sense -- publishers will not create courses for a marketplace where learners cannot find them.

## What changes

Learners discover courses through an enhanced catalog with search, category filtering, and course previews. Publishers assign categories and tags when creating courses. The catalog landing shows featured or popular courses and supports text search across course titles and descriptions. Learners can filter by category, price (free vs. paid), and language. Course cards show enrollment count as social proof. Prospective learners can preview a course's structure (module and lesson titles) before enrolling, and publishers can optionally mark one lesson as a free preview.

## Acceptance criteria

- Publisher assigns one or more categories and optional tags when creating or editing a course.
- Catalog supports text search across course titles and descriptions.
- Catalog supports filtering by category, price range (free/paid), and language.
- Catalog landing shows a curated or popular section above the full course list.
- Course cards display enrollment count alongside title, description, and price.
- Course detail page shows the full module and lesson structure as a preview.
- Publisher can mark one lesson as a free preview accessible to unenrolled learners.
- Free preview lesson renders content and exercises without requiring enrollment.
- Search and filter state persists in URL so results are shareable and bookmarkable.
- Catalog discovery works on both web and mobile.

## Out of scope

        - AI-powered recommendations ("learners like you also enrolled in...").

- Full-text search of lesson content (only titles and descriptions).
- Publisher-controlled landing page or custom course marketing copy.

## Dependencies

- None (extends existing catalog).

## Notes

Categories could start as a predefined list (Languages, Business, Technology, etc.) with a plan to expand. Enrollment count is derivable from the existing enrollments table. Free preview needs a flag on the lesson or content page level within the course version content blob. Search could start with simple Postgres text search (ts_vector) and evolve to dedicated search if volume demands it.

---

## Implementation Plan

1. Extend course data model and API contract for marketplace discovery metadata: category IDs, tags, language code, enrollment count, popularity score, and preview lesson flag.
2. Add database migration and repository updates for searchable/filterable catalog queries and stable popularity ranking abstraction.
3. Update publisher authoring to manage categories/tags/language and free preview lesson selection with sane defaults.
4. Update web catalog and course detail with featured/popular section, URL-persisted search/filters, enrollment count, previewable structure, and unauthenticated free preview navigation.
5. Update learner mobile catalog discovery with search/filter controls and parity support for previewable lesson access without enrollment persistence.
6. Add and update integration/unit/e2e tests and spec behaviors for discovery, filtering, preview access, and URL state persistence.

## Task List

- [x] Add schema and migration support for marketplace metadata and popularity abstraction.
- [x] Update API GraphQL types, queries, and repository contracts for catalog discovery and preview lesson access.
- [x] Implement publisher metadata editing (categories, tags, language, free preview lesson).
- [x] Implement web catalog discovery UI and shareable URL search/filter state.
- [x] Implement mobile catalog discovery and preview parity.
- [x] Update specs and automated tests for new discovery behaviors.
- [x] Run full validation and test suite and record results.

## Implementation Notes

- 2026-03-22: User confirmed scope and implementation choices: both web and mobile support, predefined but extensible categories, language as course-level field, popularity section based on enrollment count with extensible scoring abstraction, and free preview lesson that does not persist attempts.
- Next step: implement schema, API, and UI flow changes end-to-end, then run CI-equivalent local validation commands.
- 2026-03-22: Ran validation and test commands. `pnpm validate:lockfile` failed because repository expects pnpm major 9 while environment has pnpm 8.6.1 and lockfile major 6. This needs a lockfile regeneration with pnpm 9 (Corepack) before the global gate can pass.
- 2026-03-22: Fixed API worker startup regression by moving `selectByInChunks` enrollment aggregation back inside `hydratePublicRows` in `apps/api/src/features/course/repository-db.ts`. This resolved e2e boot failure (`ReferenceError: selectByInChunks is not defined`).
- 2026-03-22: Updated integration wiring assertions in `tests/integration/publishers-course.test.js` to reflect newly introduced publisher fields (`languageCode`, `categoryIds`, `tags`, `previewLessonId`) and actual data-test key names.
- 2026-03-22: `pnpm test:integration` now passes after assertion updates. `pnpm test:e2e` still fails in publisher flow with timeout waiting for Stripe async sync message (`real Stripe hosted checkout updates purchase success UI to enrolled`), which appears unrelated to BG-030 scope but blocks full green validation.
- 2026-03-22: Regenerated lockfile with repository-declared pnpm major (`corepack pnpm@9.12.2`) and verified lockfile parity now passes (`lockfileVersion` major 9).
- 2026-03-22: Updated purchase success route pending copy rendering so pending sync message remains visible while polling and through transition states until error/empty course, eliminating flaky assertion timing in Stripe hosted checkout e2e.
- 2026-03-22: Completed mobile marketplace parity in `LearnerHome` and `LearnerMobileApp`: search + price/category/language filters, featured section ranked by popularity score, enrollment count display, and free preview lesson opening from catalog for unenrolled learners using `publicPreviewCourse`.
- 2026-03-22: Enforced preview non-persistence on mobile by bypassing resume-position mutation while in preview mode (`screen.previewMode`).
- 2026-03-22: Added missing i18n keys for catalog discovery and publisher metadata labels in `shared/shared-i18n/src/resources.ts` to keep all new user-facing strings localization-ready.
- 2026-03-22: Added integration wiring coverage for BG-030 in `tests/integration/learners-course.test.js` (`marketplace discovery wiring`) and updated existing assumptions for seed metadata.
- 2026-03-22: Updated `spec/learner-experience.md` under Public catalog and enrollment with search/filter/featured/enrollment-count/preview behaviors and web/mobile parity.

## Tests

- `pnpm validate:lockfile` -> passed
- `pnpm lint` -> passed
- `pnpm build` -> passed
- `pnpm test:unit` -> passed
- `pnpm test:integration` -> passed
- `pnpm test:e2e` -> passed
