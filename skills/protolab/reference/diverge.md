# Diverge, then converge

Divergence is how the lab compares directions before choosing one: each approach is a full,
working version built with the host's components and tokens, and the comparison view shows them
side by side at the same size and the same state. No design canvas: everything lives in the host
repo. Diverging changes how a block works, not only how it is arranged.

## 1. Frame the divergence

- **The question**: one line, what the user decides by comparing (`Which hero gets a CFO to start
  a trial?`). It opens the root file as a comment and the recap. Without it, the approaches drift
  into taste.
- **What diverges**: start from the Blocks table of the proto's `context.md`. Name the block and
  its current pattern (`What it keeps, what it adds: comparison table`), or the whole screen.
  Without a `context.md` (an older proto), write the block's row first: role, pattern, covered by.
  Name the axis after the block: `hero`, `filters`, `keeps-adds`; `approach` for the whole
  screen.
- **How many**: the number the user asked for, 3 otherwise. Never more than 5: beyond that the
  grid stops being readable.
- **The directions**: each approach changes the **pattern** or the **representation** of the
  block, not only its layout:
  - another pattern: comparison table → hotspots, list → bento, tabs → stepper;
  - another representation: abstract text, a real specimen (a sample page annotated with
    hotspots), visualized data (a chart, a diagram).

  Two approaches with the same pattern and the same representation are one approach. Write one
  line per approach before coding: `<label>: <pattern>, <representation>: <hypothesis>`
  (`Annotated page: hotspots, real specimen: the reader trusts what they see on a real page`).
  Take the hypotheses from the brief, the jobs or the user's words; when the request is open,
  propose them.
- **References**, required when a Mobbin tool is available (`search_screens`, `search_sections`,
  `search_flows`): search the block's role, keep two or three products that solve it differently,
  and take the pattern names from them. Each approach says which reference it borrows from.
  Without the tool, say so and use the standard names of `/protolab create` (the Blocks table).
- **In place**: when the block belongs to a page of the app, the proto renders that page around it
  with the host's components (its header, its navigation, the neighbouring blocks) and a real
  density of data. A block alone on an empty page looks right in every approach. When the data is
  thin, add a scenario first (`/protolab scenarios`); the existing scenarios apply inside each
  approach.

Ask (`AskUserQuestion`) only when the user's words leave the block itself ambiguous. The
directions are yours to propose: say them, then build.

## 2. Build each approach

One structural axis, one value per approach, one file per value (see `/protolab variant`,
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
- The approaches share the data and any piece that is not what diverges, from a sibling file;
  never the layout of the area that diverges: each approach is free to throw it out.
- The root places `<AxisSlot axis="<key>" />`; when the whole screen diverges, the root is only
  the slot, and what all approaches keep identical (a heading, the data) goes in a sibling file
  each approach imports. When the proto already has a structural axis on the same area, nest the slots instead
  (`/protolab variant`, section 3): every existing value places the new slot, so each approach
  combines with each existing value.
- Keep the existing axes, values and ids: never remove one to make room for the approaches.
- The approaches differ in pattern or representation, and so in information hierarchy and in
  primary action (where the eye and the first click go), never only in colour or copy.
- The design system's components come first. **A piece it lacks** (a pin, a drawn box, a tag) is
  built in the proto without asking: one file per piece, `candidate-<piece>.tsx`, opening with
  `// Design system candidate: <what it is, what it would extend>`, styled with the host's tokens
  and utility classes only. A new colour, font or dependency is still asked first; a library
  outside the design system only if `ds.offDs` lists it, and the proto then gets `offDs: true`.
- Before handing over, compare the approaches: when two share the pattern and the
  representation, redo one and name the pattern it must not use (`no comparison table`).

## 3. Verify, then hand over

1. `npx protolab-check`: 0 errors; the project's typecheck passes.
2. Give the comparison links with a size, desktop and phone:
   `<basePath>/p/<slug>?compare=<key>&v=1280x800` and `…&v=390x844`. Without a size, the cells
   are narrow and the proto shows its narrow layout.
3. Recap: the question, then one line per approach: label, pattern and representation,
   hypothesis, the reference it borrows from, the candidates it builds, what to look at.
4. Ask for a verdict in the user's words. A mix ("the header of B with the list of C") is often
   the most useful answer.

## 4. Converge

When the user keeps one approach ("on garde la B", "keep zero-error"), or a mix:

1. A mix is built first, as a new value of the axis, and compared with the approaches it takes
   from; converge on it once the user confirms.
2. Commit the divergence as it stands, or ask the user to: the other approaches stay in the
   history, and the recap gives the commit.
3. Move the kept approach into the root, or keep it as the slot's single content if the user
   wants to diverge again on the same block later. Ask only if it is unclear.
4. Delete the other approaches' files and their values; remove the axis when one value is left.
5. Links that carried the removed values fall back to the default: say so.
6. Write down the verdict: the approach kept, why, and the question it settled. It goes in the
   commit message, and in the proto's brief when the entry declares one, as a line the user
   accepts. Update the block's row in `context.md`: its new pattern, what covers it.
7. List the design-system candidates the kept approach uses (`candidate-*.tsx`): what each one is,
   where it would go in the design system. Propose to add them to the design system through a PR
   in its own repo; the proto keeps its copy until the design system ships them. The candidates
   of the dropped approaches go with them.
8. `npx protolab-check` and the typecheck, then the proto's link.

## Rules

- Divergence is a structural axis, never several protos and never copies of the proto folder.
- Keys and ids in kebab-case; labels short, they title the comparison cells.
- An approach is not a theme or a colour change: that is a state axis (`/protolab variant`).

Parts of this command (the question, the approaches judged in place, the mixed verdict, the
history kept) are adapted from `prototype` in [mattpocock/skills](https://github.com/mattpocock/skills)
(MIT).
