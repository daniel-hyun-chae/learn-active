# Evaluations

This directory is the single source of truth for test directions and acceptance criteria. It replaces spec documents by expressing implementation detail in a human-readable, verifiable format.

## Structure
- Organize criteria by domain or feature in markdown files under `evaluations/`.
- Each criteria block must include a goal statement and a list of criteria.
- Use stable IDs so tests can reference criteria unambiguously.

## Reference Convention
- Every criteria block must have a unique ID in this format:
  - `EVAL-<DOMAIN>-<FEATURE>-<NNN>`
  - Example: `EVAL-AUTH-LOGIN-001`
- Every test must reference the relevant ID in its name or metadata.
  - Example test name: `login succeeds @eval(EVAL-AUTH-LOGIN-001)`
  - If your test framework supports tags/annotations, store the ID in metadata as well.

## Template
Use this structure for each criteria block:

```
## EVAL-<DOMAIN>-<FEATURE>-<NNN>: <short title>
Goal: <high-level, human-readable objective>
Criteria:
- <criterion 1>
- <criterion 2>
- <criterion 3>
```

## Example

```
## EVAL-AUTH-LOGIN-001: Login with valid credentials
Goal: Users can sign in using valid credentials and reach their account.
Criteria:
- Given a valid email and password, the login form authenticates successfully.
- The user is redirected to the account dashboard after login.
- Authentication errors are shown for invalid credentials without revealing sensitive info.
```
