# CLAUDE.md

Protolab is an npm package a Next.js App Router host installs to run prototypes built with the
host's own components. A proto is a React component of the host, registered in one hand-edited
manifest, served at `<basePath>/p/<slug>`, with its state in the URL. The engine is `src/`, the
CLIs are `bin/`, the agent skills shipped to hosts are `skills/`, the proto conventions shipped
to hosts are `rules/`, and `examples/next/` is a host wired to the local engine.

## Rules

- **The engine lives in `src/` only.** Nothing host-specific: no path, component or data of a
  particular host. Hosts never patch `node_modules`; they open a PR here.
- **No LLM call at runtime.** The intelligence runs in Claude Code through the skills; the
  package calls no model and no external service (`docs/adr/0001-no-llm-at-runtime.md`).
- **The URL is the state.** Everything the lab panel changes is a search param; nothing goes to
  local storage, cookies or server state (`docs/adr/0004-the-url-is-the-state.md`).
- **The manifest is the contract** between the skills, which write it, and the lab, which
  displays it. Its shape changes only through a new ADR, with a migration note.
- **No new dependency without an ADR**, dev-only tooling included
  (`docs/adr/0006-verification-tooling.md`). Peer dependencies stay `next` and `react`.
- **Explicit `"use client"` boundary.** A file that uses hooks, `next/navigation` or browser
  APIs starts with `"use client"`; server components stay the default. Functions (`load`,
  loaders) never cross from a server component into a client one.
- **Public repo.** English in code, docs, commits and PRs. No personal path, no client data,
  no secret, no reference to private repositories.
- **Comments are Vercel Comments.** The engine ships no comment layer and does not depend on
  `@vercel/toolbar` (`docs/adr/0003-comments-are-vercel-comments.md`).

## Verify

```bash
npm test                 # node:test on bin/ against a throwaway host
npm run typecheck        # tsc --noEmit in examples/next
npm run build:example    # next build in examples/next
npm run smoke            # Playwright: /lab, one proto, an axis switch, the URL, three sizes
npm run check            # the four above, in order
```

`examples/next` needs `npm ci` once. Smoke needs a Chromium that Playwright can find.

## Definition of done, for a slice

- `npm run check` is green, locally.
- The README says what changed when usage changes; a migration note goes in `CHANGELOG.md`
  when the manifest, the CLIs or the exported API change.
- No personal path, no client data, no secret in the diff.
- `CHANGELOG.md` has a line under `Unreleased`.
- One branch per slice, a PR to `main`, merge after review.

## Scope and debugging discipline

- No abstraction nobody asked for: the smallest diff that works, boring over clever.
- Root cause before fix: reproduce, read the code path end to end, then edit.
- A failing check: decide whether the test or the code is wrong before editing either.
- Stop after two failed attempts: write down what was tried and hand back.
- A product decision that no spec takes is not guessed: it is written down as a question and
  the slice stops there.

## Versioning

Hosts follow `main` (`npm run update:protolab`); no release tags while the only host's author is
the package's author. Every PR adds its line under `Unreleased` in `CHANGELOG.md`, with the
migration steps when a host must change its code; say so in the PR. Tags `vX.Y.Z` and SemVer come
back when someone else installs the package (tags `v0.1.0` to `v0.3.0` stay as history).

## Where to read

- `README.md`: install, use, comments, staying up to date, layout.
- `docs/adr/`: one short ADR per decision; a reversal is a new ADR that supersedes the old one.
- `rules/proto.md`: what a proto is and respects; shipped to hosts by `protolab-skills`.
- `skills/*/SKILL.md`: what the agent does in a host; `.claude/skills/`: the engineering
  skills used in this repo (review, PR feedback, config audit, artefact definition).
- `examples/next/`: the test bench; `npm run dev` there, then `/lab`.
