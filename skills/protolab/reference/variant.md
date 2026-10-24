# Add a variant

A proto varies along **axes**: any combination of values is valid, switchable from the lab panel
and kept in the URL (`?a.<key>=<id>`), so a link restores the exact combination. Never duplicate
a proto to show a variant.

## 1. Pick the kind of variation

| What varies | Declare | The proto |
|---|---|---|
| A mode of the same screen: empty, loading, error, compact, another wording | a **state axis** (`kind` absent) | reads `useAxis("<key>")` and branches its render |
| Two or more versions of a block or of the layout, each worth its own file: filters above the tabs vs in a side panel, a table vs cards, two heroes | a **structural axis** (`kind: "structural"`), one component per value | places `<AxisSlot axis="<key>" />` where the block goes; the engine renders the current value's component |
| The data the screen shows: 0, 12 or 500 items, a role, a persona whose data differ | a **scenario**: use `/protolab scenarios` | |
| A view the proto moves to: list → detail, step 1 → 2 | **screens** and **steps** (section 4) | |

Rule of thumb: if `value === "x" ? <A /> : <B />` would wrap more than half of the component, or
if the user will keep one version and drop the other, make it **structural**. A wording that
changes per persona while the component stays the same is a **state** axis.

Ask (`AskUserQuestion`, with a default) only if the request fits two rows and the choice changes
what the user sees. Otherwise pick, and say which kind you chose and why in one line.

**The request names something the proto does not have yet** ("filters above the tabs" on a
proto without tabs): add it in its simplest form with the design system, as part of the
variant, and say what you added. Do not ask.

**Never remove or rename an existing axis, value or id as a side effect**: links that carry it
fall back to the default, and a removed axis can no longer be compared side by side. Propose the
removal; do it only when the user agrees. Labels are not ids: after adding an axis, re-read the
existing labels and the entry's `description`, and fix any that became false.

## 2. A state axis

Manifest, on the proto's entry:

```ts
axes: [
  { key: "state", label: "State", values: [
    { id: "rest", label: "Rest" },
    { id: "empty", label: "Empty" },
    { id: "error", label: "Error" },
  ] },
],
```

Component (`"use client"`):

```tsx
import { useAxis } from "@romeohunneaul/protolab";
const state = useAxis("state"); // "rest" | "empty" | "error"
```

## 3. A structural axis

Manifest: `kind: "structural"` and a `load` on **every** value, a dynamic import relative to the
manifest file (`./protos/<slug>/<file>` when the manifest sits next to the protos folder):

```ts
{ key: "filters", label: "Filters", kind: "structural", values: [
  { id: "top", label: "Above the tabs", load: () => import("./protos/reading-list/filters-top") },
  { id: "side", label: "Side panel", load: () => import("./protos/reading-list/filters-side") },
] },
```

Files: one per value, `<protosDir>/<slug>/<axis key>-<value id>.tsx`, with a default export and
**no props** (`"use client"` as the rule says). A value component reads the other axes, the screen and the
scenarios with the same hooks as the root (`useAxis`, `useScreen`, `useScenario`), so the other
axes still apply inside each version. Shared pieces (the data, a row, a filter list) go in a
sibling file both versions import; do not copy them twice.

Root `index.tsx`: place the slot where the block goes. When the whole layout is what varies, the
root renders only the slot:

```tsx
import { AxisSlot } from "@romeohunneaul/protolab";
export default function ReadingList() {
  return <AxisSlot axis="filters" />;
}
```

A structural axis whose slot is not placed renders nothing and `protolab-check` cannot see it:
check that `<AxisSlot axis="<key>" />` is in the code.

**State shared by several values or slots** (the selected filters used by the filter block and by
the list): value components take no props, so share it through a React context provided by the
root (`index.tsx`), in a sibling file (`reading.tsx`) that the values import.

**Two structural axes on the same area** (a `filters` axis exists and the user now wants N
approaches of what it frames): nest them. Each value of the outer axis places the inner slot
where its content goes (`filters-side.tsx` renders the side panel, then
`<AxisSlot axis="approach" />`), so every combination stays valid. Check that **every** value of
the outer axis places the inner slot. Putting the new axis at the root instead would make the
existing one dead in some values: never do that.

## 4. Screens and steps

For a proto with several views, declare `screens` (the first one is the landing screen) and,
on a screen with a multi-step flow, `steps` (labels, 1-based in the URL):

```ts
screens: [
  { key: "list", label: "List" },
  { key: "checkout", label: "Checkout", steps: ["Address", "Payment", "Confirmation"] },
],
```

```tsx
const { screen, go, step, steps, next, prev } = useScreen();
// go("checkout") opens step 1; go("checkout", 2) a given step; next() / prev() move one step
```

Each move pushes a browser history entry, so Back walks the flow; the URL carries
`?screen=<key>&step=<n>`. Axes stay independent from screens.

## 5. Gestures inside the proto

What the proto's own controls change (the open tab, the toggled filters, a typed search, an open
dialog) is the proto's interaction state: `useState` is right for it. It is not lab state, a link
does not restore it, and in the comparison view each cell keeps its own. When a reviewer must
land on it from a link (the "Finished" tab, the dialog open), make it a screen (section 4) or an
axis instead. The panel drives axes, screens and scenarios; the proto drives the rest.

## 6. Verify, then hand over

1. `npx protolab-check`: 0 errors.
2. The project's typecheck (`npx tsc --noEmit` or its script).
3. Give the links, with `<basePath>` from the config:
   - the variant: `<basePath>/p/<slug>?a.<key>=<id>`
   - side by side at desktop width: `<basePath>/p/<slug>?compare=<key>&v=1280x800`
   - side by side at phone width: `<basePath>/p/<slug>?compare=<key>&v=390x844`

   Without a size, comparison cells are as narrow as the window divided by the number of values
   (about 540 px each for two values on a laptop), so the proto renders its narrow layout. Pass a
   size; never adapt the proto's breakpoints to the comparison cells.

Do not run the app to judge the render in the user's place: the visual check is theirs.

## Rules

- **Orthogonal axes.** A value never assumes another axis's value. Two dimensions that constrain
  each other are two axes, never a combined one.
- **Keys and ids in kebab-case** (`side-panel`, not `sidePanel`): they go in the URL;
  `protolab-check` refuses anything else.
- **Explicit `default`** when the first value is not the resting state.
- **No data in an axis.** A list of items is data: a scenario, or constants in the proto.
- **Labels in the host's language** for what the screen shows; axis and value labels are what
  the panel shows, short.
- **The design system first.** A missing component (no `Tabs` in the host's library, for
  instance) is a gap to report, not a reason to restyle: compose with the existing components and
  say so, or use a library the config allows outside the design system (`ds.offDs`) and set
  `offDs: true` on the proto. What counts as custom CSS: `.claude/rules/proto.md`.
