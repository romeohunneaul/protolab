# 0006. Verification tooling: node:test and Playwright, dev-only

Date: 2026-10-15 · Status: accepted

## Context

The package had no test. The rule "no dependency without an ADR" applies to tooling too.

## Decision

- `node:test` (Node ≥ 20, no dependency) tests `bin/` against a throwaway host created in a temp
  directory.
- `examples/next` is the type and build check of the engine: `tsc --noEmit` and `next build`.
- `@playwright/test` is the only new devDependency, for a single smoke spec on the built
  example: `/lab`, one proto, an axis switch, the URL, three sizes. Browsers already installed on
  the machine are reused when their revision matches.

## Consequences

- `npm run check` chains the four; a slice is done when it is green.
- No test framework beyond these; a unit test of pure logic in `src/` uses `node:test` too.
- The runtime dependency surface of the package is unchanged (peer `next`, `react`).
