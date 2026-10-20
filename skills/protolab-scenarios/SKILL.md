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
| The empty state forced by the component whatever the data | a state axis; a scenario with 0 items produces it through the data. If the proto already has an empty state axis, keep it and add the scenario next to it: removing the axis breaks links and the side-by-side comparison of empty vs full |

A scenario cannot be compared side by side (the comparison view varies an axis). If the user
wants personas side by side and only the wording differs, make it a state axis.

## 2. The data set

A sibling file of the proto, `<protosDir>/<slug>/data.ts`, typed, deterministic, no network call:

```ts
export type Book = { title: string; date: string; tags: string[] };

// As many distinct seeds as the biggest value needs: a repeated item ("Shape Up (2)") is not plausible.
const SEEDS: Omit<Book, "date">[] = [
  { title: "Shape Up", tags: ["product"] },
  { title: "Thinking in Systems", tags: ["systems", "classic"] },
  // …
];

/** The first `count` seeds, dated from the most recent: the same count always gives the same list. */
export const books = (count: number): Book[] =>
  SEEDS.slice(0, count).map((seed, i) => ({ ...seed, date: `2026-${String(12 - (i % 12)).padStart(2, "0")}-01` }));
```

- **Deterministic**: no `Math.random`, no `Date.now`: the same link must show the same data.
- **Plausible**: names, amounts and dates that look like the real domain, in the host's language,
  every item distinct. Public works (book titles, products) may be real; people, customers and
  their data are always fictional.
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

Component (`"use client"`): the root, or the component that shows the data. When several values
or slots show it, read it once in a context provider at the root and share it
(`protolab-variant`, section 3):

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
