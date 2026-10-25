# 0010. `/protolab create` reads the real app on the scope of the screen

Date: 2026-10-25 · Status: accepted

## Context

`create` read the brief, the jobs, the host's code and the design system's components, and wrote
"plausible placeholders" for the data. A proto came out with the right components but a data shape
invented next to the app's, and the screen built element by element without the compositions the
app already uses. When the protos live in a repo of their own (a host next to the app), the app was
out of reach: the command forbade searching the disk, and nothing declared where the app is.

## Decision

- **The brief is clarified before any reading**: the screen, its user, its data, its states; then
  the list of the screen's elements.
- **Each element is mapped** by `/protolab ds` to a component, an existing composition of the app,
  or a gap.
- **The real app is read on the scope of the screen only**: its page, its domain types and data,
  its fixtures and content, its feature components. The proto copies the shape and the values,
  never the plumbing: no fetch, no auth, no state or form library, no error handling, no import
  from the app.
- **`app` in `protolab.config.json`** (optional) gives the path to the real app from the host
  root; absent, the app is the host. No other disk search: a source the user names is read too.
- **`context.md`** in the proto's folder records what was read; the other commands start from it.

## Consequences

- A proto's data matches the app's types and fixtures; invented values are only what the app does
  not hold, and are marked.
- The engine and `protolab-check` ignore `app`; only the skill reads it.
- Env files, secrets, databases and production exports are never read.
