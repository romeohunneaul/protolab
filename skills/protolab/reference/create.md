# Create a prototype

Goal: from a feature intent to a screen running at `<basePath>/p/<slug>`, built with **the
project's components**. The metric is the time between "I have an idea" and "I see it on
screen", not the ceremony.

## 1. Gather the context, in this order

1. **The intent**: restate it in one or two sentences, plus the visible states it implies (empty,
   loading, error, a long list). Note the ambiguities; do not guess them.
2. **The brief and the jobs**, when they exist: a brief file the user points to (it becomes the
   entry's `brief` field), and the jobs of the feature in the host's product repo (a `jtbd.md`).
   They give the directions and the edge cases.
3. **What exists**: if the feature touches a coded area of this repo, read it; the proto should
   look like the product, not start from scratch.

A source that is not reachable from this repo (the live site lives elsewhere, there is no product
repo, no brief) is skipped: say which ones, and continue. Do not search the disk for them.
4. **The design system**: run `/protolab ds`.
5. **References** (optional): if a Mobbin tool is available, look at two or three products that
   solve the same screen.

If the intent is too vague for a screen, `AskUserQuestion` with proposed defaults.

## 2. Scaffold

```bash
npx protolab-new <slug> "<Name>" "<Author>" "<Description>"
```

It creates `<protosDir>/<slug>/index.tsx` and appends the entry (with `load`) to the manifest,
then prints `<basePath>/p/<slug>`. Never write the entry by hand: a manual insertion breaks
`load` or a comma. `slug` in kebab-case.

## 3. Build

Edit `<protosDir>/<slug>/index.tsx`:

- import the real components the way `/protolab ds` said; never copy their style;
- labels in the host's language: the `lang` of its root layout, else the language of the
  existing protos;
- content only the user knows (what they work on, their clients, their numbers): write plausible
  placeholders in `data.ts`, mark them as placeholders in a comment, and say so in your reply.
  Never present invented facts as real;
- several views (list → detail, a flow in steps): declare `screens` and `steps` and move with
  `useScreen` (`/protolab variant`, section 4);
- `"use client"` when the file reads a lab hook or has interactivity.

Then, depending on the request:

| The user wants | Next |
|---|---|
| Several approaches, or the intent is open ("explore", "propose") | `/protolab diverge` |
| States: empty, loading, error, compact | `/protolab variant` |
| Realistic data: volumes, roles, personas | `/protolab scenarios` |

## 4. Verify, then hand over

1. `npx protolab-check`: 0 errors.
2. The project's typecheck (`npx tsc --noEmit` or its script).
3. Do **not** run the app to judge the render in the user's place: you guarantee that it
   compiles and that the design system is respected; the visual check is theirs.
4. Give the link: `<basePath>/p/<slug>`.

## Rules

- **Deliverable = a standalone React component** reusing the design system. A static `.html` is
  never valid.
- **Never invent** a component, a prop or a class: check with `/protolab ds`.
- **Custom CSS = last resort**, with the project's classes or tokens only, after validation.
- The proto is **throwaway and outside production** (the lab is `noindex`): no tests, no
  exhaustive accessibility required unless the user asks.
