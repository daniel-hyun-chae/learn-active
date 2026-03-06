# Platform Initialization Evaluations

## EVAL-PLATFORM-INIT-001: Monorepo structure is ready

Goal: Provide a clear, separated structure for learners, mobile, API, and shared packages.
Criteria:

- The repository includes apps for web (learn + publish), learners mobile, and the API.
- Shared domain-agnostic packages live under `shared/`.
- Feature/domain folders exist inside each app for their primary feature area.

## EVAL-PLATFORM-INIT-002: Localization readiness

Goal: Ensure user-facing strings are translatable from the start.
Criteria:

- Learner and publisher web UI pull strings from shared i18n resources.
- Learner mobile UI pulls strings from shared i18n resources.
- Shared i18n resources include the initial UI copy for learners and publishers.

## EVAL-PLATFORM-INIT-003: Offline attempt scaffolding

Goal: Allow learners to start a quiz attempt offline and persist locally.
Criteria:

- Web app includes a quiz attempt store backed by web storage.
- Mobile app includes a quiz attempt store backed by AsyncStorage.
- Creating a quiz attempt stores a draft with attempt ID, quiz ID, answers, and timestamps.

## EVAL-PLATFORM-INIT-004: GraphQL API skeleton

Goal: Provide a working GraphQL server entry point with initial schema types.
Criteria:

- API server exposes a GraphQL endpoint.
- Health query returns a static "ok" string.
- Quiz formats query returns a list of initial quiz format enum values.

## EVAL-PLATFORM-INIT-005: Architecture documentation

Goal: Keep architecture documentation current when core structure changes.
Criteria:

- `architecture/overview.md` exists and documents system context, components, and data flows.
- Documentation references evaluations and decision logs.
