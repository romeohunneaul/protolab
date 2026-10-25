# Create a prototype

Goal: from a feature intent to a screen running at `<basePath>/p/<slug>`, built with **the
project's components** and shaped like **the real app**. The metric is the time between "I have
an idea" and "I see it on screen", not the ceremony: the context is gathered once, precisely, and
the proto skips everything production code would need.

## 1. Clarify the brief

1. **The intent**: restate it in one or two sentences.
2. **The brief and the jobs**, when they exist: a brief file the user points to (it becomes the
   entry's `brief` field), and the jobs of the feature in the product repo (a `jtbd.md`). They give
   the directions and the edge cases.
3. Settle four things before gathering anything else: **the screen** (where it sits in the app,
   what it replaces or extends), **its user**, **the data it shows**, **the states it implies**
   (empty, loading, error, a long list). What the brief and the user's words leave open goes in one
   `AskUserQuestion`, with proposed defaults. Do not guess a product decision.

Then list the **elements of the screen**: the blocks, controls and pieces of data it needs (a
header, a filter bar, a list of rows with a title, a date and a status, an empty state). Steps 2
and 3 work from this list.

## 2. The design system: map each element to what exists

Run `/protolab ds` with the list of elements. It returns, for each element, the component that
covers it (its import, its real props and states), the composition the app already uses for it
(a page or a block that solves the same need, with its file), or a gap. Nothing is built from
scratch when a component or a composition covers it.

## 3. The real app on the scope: mirror its shape

Read where the real app lives: `app` in `protolab.config.json` (a path from the host root, such
as `../portfolio`, when the protos live in a repo of their own), else the host itself. Read only
that repo and the host; another source on the disk is read only if the user names it. If `app` is
absent and the host has no code for the scope, ask the user once where the app lives, and offer to
write `app` in the config.

On the scope of the screen, and nothing beyond it:

| Read | To take |
|---|---|
| The route or page the screen belongs to, or its closest neighbour | The layout around it (shell, navigation, header), the place of the new screen, the copy's tone |
| The domain types and data the screen shows (types, schemas, content collections, data files) | The shape of the data: field names, types, nesting, enumerations, realistic volumes |
| The fixtures, seeds, mocks and content files of the scope | Values to copy into the proto, rather than inventing them |
| The feature components the app already has for this scope (outside the design system) | What the screen reuses or extends, and how it composes the design system |

Never read env files, secrets, databases or production exports. Stop reading once the four rows
are answered: the goal is a proto close to reality, not an audit of the codebase.

**Mirror the shape, skip the plumbing.** The proto does not bring the app's constraints along:

- no API call, no data fetching, no auth, no server action: the data is in `data.ts`;
- no state library, no form library, no validation beyond what the screen shows;
- no error handling, retries, i18n setup, analytics, tests or performance work;
- no import from the app's repo: the types the proto needs are copied into `data.ts`, with a
  comment naming the source file.

## 4. Scaffold

```bash
npx protolab-new <slug> "<Name>" "<Author>" "<Description>"
```

It creates `<protosDir>/<slug>/index.tsx` and appends the entry (with `load`) to the manifest,
then prints `<basePath>/p/<slug>`. Never write the entry by hand: a manual insertion breaks
`load` or a comma. `slug` in kebab-case.

Then write `<protosDir>/<slug>/context.md`, short, so the other commands start from it instead of
gathering again:

- the question the proto answers, in one line, and the brief's path;
- a **Blocks** table, one row per block of the screen:

  | Block | Role | Pattern | Covered by |
  |---|---|---|---|
  | What it keeps, what it adds | the reader sees which parts of a page the tool changes | comparison table | `Table`, `Badge` |
  | Setup | the reader follows the install in order | stepper | `Steps`, `Code` |
  | Empty list | the reader knows what to do first | empty state | `EmptyState` (composition: `app/notes/page.tsx`) |

  The role is what the reader must understand or do. The pattern is a standard name: comparison
  table, list, card grid, bento, stepper, tabs or switcher, hotspots, timeline, form, chart, empty
  state. Covered by: the components and their import, an existing composition and its file, or
  **gap**;
- the sources of the data: the types and files it mirrors, with their paths;
- what the proto leaves out on purpose (the plumbing above, the open questions).

## 5. Build

Edit `<protosDir>/<slug>/index.tsx`:

- import the real components the way `/protolab ds` said; never copy their style;
- reuse the app's layout around the screen (step 3) with the design system's components;
- the data in `data.ts`: the copied types, and values taken from the app's fixtures and content.
  What only the user knows (their clients, their numbers) and the app does not hold: plausible
  placeholders, marked as such in a comment and in your reply. Never present invented facts as
  real;
- labels in the host's language: the `lang` of its root layout, else the language of the
  existing protos;
- several views (list → detail, a flow in steps): declare `screens` and `steps` and move with
  `useScreen` (`/protolab variant`, section 4);
- `"use client"` when the file reads a lab hook or has interactivity.

Then, depending on the request:

| The user wants | Next |
|---|---|
| Several approaches, or the intent is open ("explore", "propose") | `/protolab diverge` |
| States: empty, loading, error, compact | `/protolab variant` |
| Realistic data: volumes, roles, personas | `/protolab scenarios` |

## 6. Verify, then hand over

1. `npx protolab-check`: 0 errors.
2. The project's typecheck (`npx tsc --noEmit` or its script).
3. Do **not** run the app to judge the render in the user's place: you guarantee that it
   compiles and that the design system is respected; the visual check is theirs.
4. Give the link, `<basePath>/p/<slug>`, and what the proto took from the app and what it
   invented.

## Rules

- **Deliverable = a standalone React component** reusing the design system. A static `.html` is
  never valid.
- **Never invent** a component, a prop or a class: check with `/protolab ds`.
- **Never invent a data shape the app already has**: copy it from the scope (step 3).
- **Custom CSS = last resort**, with the project's classes or tokens only, after validation. A
  piece the design system lacks is a **gap** in the Blocks table, not a component built here;
  `/protolab diverge` may build it as a design-system candidate.
- The proto is **throwaway and outside production** (the lab is `noindex`): no tests, no
  exhaustive accessibility required unless the user asks.
