---
name: protolab-scenarios
description: Adds context scenarios to a proto of the lab - the data the screen renders with (a volume of 0, 12 or 500 items, a role that sees other rows, a persona whose numbers and names differ) - as data sets switchable from the panel and kept in the URL. Use when the user says "teste avec beaucoup de données", "et si la liste est vide", "avec 500 lignes", "vu par un admin", "ajoute des scénarios", "add realistic data". For a mode of the screen (empty, loading, error) forced by the component, or a wording that changes per persona, use protolab-variant.
---

# protolab: context scenarios

A scenario is a context the proto renders in: its **data**. The panel switches it like an axis,
the URL carries it (`?s.<key>=<id>`), and the data set of the current value loads in the
browser when it becomes current. A scenario carries data, never a mode of the screen.

**Before writing:** read `.claude/rules/proto.md`, `protolab.config.json` and the proto.

## 1. Scenario or axis?

| What varies | Declare |
|---|---|
| The number of items: 0, 12, 500 | a scenario |
| The rows a role is allowed to see | a scenario |
| A persona whose numbers and names differ | a scenario |
| A persona where only the wording of the component changes | a state axis (`protolab-variant`) |
| The empty state forced by the component whatever the data | a state axis; a scenario with 0 items produces it through the data. Pick one, say which |

A scenario cannot be compared side by side (the comparison view varies an axis). If the user
wants personas side by side and only the wording differs, make it a state axis.

## 2. The data set

A sibling file of the proto, `<protosDir>/<slug>/data.ts`, typed, deterministic, no network call:

```ts
export type Book = { title: string; date: string; summary: string; tags: string[] };

const TITLES = ["Shape Up", "Thinking in Systems", "The Mom Test", "Inspired"];

/** `count` books, always the same for the same count: a shared link shows the same list. */
export const books = (count: number): Book[] =>
  Array.from({ length: count }, (_, i) => ({
    title: TITLES[i % TITLES.length] + (i >= TITLES.length ? ` (${Math.floor(i / TITLES.length) + 1})` : ""),
    date: `2026-${String((i % 12) + 1).padStart(2, "0")}-01`,
    summary: "…",
    tags: [["design"], ["product"], ["systems", "classic"]][i % 3],
  }));
```

- **Deterministic**: no `Math.random`, no `Date.now`: the same link must show the same data.
- **Plausible**: names, amounts and dates that look like the real domain, in the host's language;
  fictional, never a real customer or person.
- **The edges that matter**: an empty set, a typical set, a set big enough to stress the layout
  (long lists, long names, large numbers).

## 3. Declare and read

Manifest, on the proto's entry (`default`: the most representative value):

```ts
scenarios: [
  { key: "volume", label: "Volume", default: "12", values: [
    { id: "0", label: "0 books", data: () => import("./protos/reading-list/data").then((m) => m.books(0)) },
    { id: "12", label: "12 books", data: () => import("./protos/reading-list/data").then((m) => m.books(12)) },
    { id: "500", label: "500 books", data: () => import("./protos/reading-list/data").then((m) => m.books(500)) },
  ] },
],
```

Component (`"use client"`), and every structural value component that shows the data:

```tsx
import { useScenario } from "@romeohunneaul/protolab";
import type { Book } from "./data";

const { data, loading } = useScenario<Book[]>("volume");
if (loading) return null;          // or a skeleton from the design system
const items = data ?? [];
```

- `data` is `undefined` while loading and for a value without `data`: always handle both.
- Replace the proto's hard-coded constants with the scenario's data, so the switch shows.
- A data set that throws makes the proto fail to render (the host's error page): keep the
  builders simple.

## 4. Verify, then hand over

1. `npx protolab-check`: 0 errors; the project's typecheck passes.
2. Links: `<basePath>/p/<slug>?s.<key>=<id>` for each value worth looking at, with `&v=390x844`
   for the big set on a phone.

## Rules

- Keys and ids in kebab-case (`0`, `12`, `admin`, `cfo`): they go in the URL.
- The URL carries the value's id, never the data.
- One scenario per independent dimension (volume, role): they combine freely with each other and
  with the axes.
