---
name: protolab-diverge
description: Produces several competing approaches of a screen or a block of an existing proto (3 by default), as the values of one structural axis, to compare side by side in the lab's comparison view, then converges on the one the user keeps. Use when the user says "propose-moi N approches", "explore plusieurs directions", "diverge sur ce hero", "montre-moi d'autres façons de faire cet écran", "give me 3 options", or "on garde la B" to converge. For one extra version of a block the user already described, use protolab-variant.
---

# protolab: diverge, then converge

Divergence is how the lab compares directions before choosing one: each approach is a full,
working version built with the host's components, and the comparison view shows them side by
side at the same size and the same state. No design canvas: everything lives in the host repo.

**Before writing:** read `.claude/rules/proto.md`, `protolab.config.json`, the proto (manifest
entry and folder), its brief if the entry declares one (`brief`), and run `protolab-ds-context`.

## 1. Frame the divergence

- **What diverges**: a block (the hero, the filters, the list) or the whole screen. Name the axis
  after it: `hero`, `filters`, `layout`; `approach` when the whole screen diverges.
- **How many**: the number the user asked for, 3 otherwise. Never more than 5: beyond that the
  grid stops being readable.
- **The directions**: each approach answers a different hypothesis about what the user of the
  screen needs, not a cosmetic change. Write one line per approach before coding:
  `<label>: <the hypothesis>` (`KPI first: the CFO decides on numbers`; `Zero error: the ops
  lead fears mistakes`). Take them from the brief, the jobs or the user's words; when the request
  is open, propose them.
- **References** (optional): if a Mobbin tool is available (`search_screens`, `search_flows`),
  look at how two or three products solve the same screen and say what each approach borrows.
  Mobbin informs; it never replaces the host's components.

Ask (`AskUserQuestion`) only when the user's words leave the block itself ambiguous. The
directions are yours to propose: say them, then build.

## 2. Build each approach

One structural axis, one value per approach, one file per value (see `protolab-variant`,
section 3, for the exact shapes):

```ts
{ key: "hero", label: "Hero", kind: "structural", values: [
  { id: "kpi", label: "KPI first", load: () => import("./protos/landing/hero-kpi") },
  { id: "zero-error", label: "Zero error", load: () => import("./protos/landing/hero-zero-error") },
  { id: "tool", label: "Business tool", load: () => import("./protos/landing/hero-tool") },
] },
```

- Each file opens with a one-line comment stating its hypothesis.
- Each approach is complete: real copy in the host's language, its states (the existing state
  axes apply inside each approach through `useAxis`), its responsive behaviour.
- The approaches share the data and any piece that is not what diverges, from a sibling file.
- The root places `<AxisSlot axis="<key>" />`; when the whole screen diverges, the root is only
  the slot. When the proto already has a structural axis on the same area, nest the slots instead
  (`protolab-variant`, section 3): every existing value places the new slot, so each approach
  combines with each existing value.
- Keep the existing axes, values and ids: never remove one to make room for the approaches.
- The approaches differ in structure and hierarchy, and all use the design system. An approach
  that needs a library outside it is allowed only if `ds.offDs` lists it; the proto then gets
  `offDs: true`.

## 3. Verify, then hand over

1. `npx protolab-check`: 0 errors; the project's typecheck passes.
2. Give the comparison links with a size, desktop and phone:
   `<basePath>/p/<slug>?compare=<key>&v=1280x800` and `…&v=390x844`. Without a size, the cells
   are narrow and the proto shows its narrow layout.
3. Recap, one line per approach: label, hypothesis, what to look at.

## 4. Converge

When the user keeps one approach ("on garde la B", "keep zero-error"):

1. Move the kept approach into the root, or keep it as the slot's single content if the user
   wants to diverge again on the same block later. Ask only if it is unclear.
2. Delete the other approaches' files and their values; remove the axis when one value is left.
3. Links that carried the removed values fall back to the default: say so.
4. `npx protolab-check` and the typecheck, then the proto's link.

## Rules

- Divergence is a structural axis, never several protos and never copies of the proto folder.
- Keys and ids in kebab-case; labels short, they title the comparison cells.
- An approach is not a theme or a colour change: that is a state axis (`protolab-variant`).
