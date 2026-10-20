---
paths: src/lab/protos/**/*.tsx
---

# Proto: conventions

A proto is a React component of the host project, registered in the lab's manifest, served at
`<basePath>/p/<slug>`, built with the project's components. It is not a page of the app (it has
no route outside the lab), nor an HTML mock-up, nor a component of the design system.

## Structure

```
<protosDir>/<slug>/
  index.tsx              # default export: the proto's root component
  <axis>-<value>.tsx     # one per value of a structural axis (optional)
  data.ts                # its data: constants, and the data sets of its scenarios (optional)
```

```tsx
"use client";                                     // if the file reads a lab hook or has interactivity
import { AxisSlot, useAxis, useScenario, useScreen } from "@romeohunneaul/protolab";

export default function InvoiceList() {           // PascalCase of the slug
  const density = useAxis("density");             // a state axis value, from the URL
  const { screen, go } = useScreen();             // the current screen, and moving to another
  const { data, loading } = useScenario("volume"); // the current scenario's data set
  return <AxisSlot axis="filters" />;             // where a structural axis renders its value
}
```

The manifest entry (`slug`, `name`, `author`, `description`, `load`, then optional `axes`,
`screens`, `scenarios`, `brief`, `offDs`) is written by `protolab-new` and completed by the
skills; `load` imports `./protos/<slug>`.

## Naming and location

| Element | Form | Example | Avoid |
|---|---|---|---|
| Folder | `<protosDir>/<slug>/`, slug in kebab-case | `src/lab/protos/invoice-list/` | `InvoiceList/`, `invoice_list/`, a file without a folder |
| Root file | `index.tsx`, default export | `index.tsx` | `InvoiceList.tsx`, a named export |
| Component | PascalCase of the slug | `InvoiceList` | `Proto`, `Page`, `Index` |
| Structural value | `<axis key>-<value id>.tsx`, default export, no props | `filters-side.tsx` | a value inlined in `index.tsx` |
| Keys and ids | kebab-case, named after what varies | `density`, `side-panel`, `500` | `Density`, `axis1`, `sidePanel` |
| Pieces of the proto | in the proto's folder | `invoice-list/row.tsx` | in `componentsDir` |

## Rules

- The proto uses the project's real components, imported the way the project imports them,
  without copying or overriding their style: fidelity to the design system is what makes the
  proto credible. A library outside the design system only if the config lists it (`ds.offDs`),
  and the entry then says `offDs: true`.
- A variation is declared in the manifest and read through the hooks: a mode is a state axis
  (`useAxis`), a competing version of a block is a structural axis (`AxisSlot`), data is a
  scenario (`useScenario`), a view is a screen (`useScreen`). Never local state that doubles the
  URL: the URL is the state, and a link must restore the screen.
- `"use client"` opens a file that reads a lab hook or has interactivity.
- What the proto's own controls change (an open tab, toggled filters, a search) is its
  interaction state: `useState` is right for it. A link does not restore it; when a reviewer must
  land on it from a link, make it a screen or an axis.
- Styling: the host's components, utility classes and tokens. Layout utilities (grid, flex,
  spacing, `sticky`, borders) with the host's tokens are fine. Custom CSS, to ask before writing,
  is anything else: a new colour, font, shadow or class, an inline style, a restyled component.
- Responsive breakpoints are the host's; never tune them to the lab's comparison cells.
- The proto calls no service: its data is in its folder (`data.ts`, deterministic). It adds no
  dependency to the host.
- Labels in the host's language, even when the conversation is in another one.
- The proto is throwaway and outside production (the lab is `noindex`): no tests, no exhaustive
  accessibility required unless asked.
- ❌ A static `.html` or a screenshot instead of a component.
- ❌ A manifest entry written by hand for a new proto: `protolab-new` writes it.
- ❌ A design-system component copied into the proto's folder to change it.
- ❌ A `useState` that carries a variant the panel should drive (a mode, a version of a block, a data set).
- ❌ A copy of the proto folder to show another approach: that is a structural axis.

## See also

- `.claude/skills/protolab-create`, `protolab-variant`, `protolab-diverge`, `protolab-scenarios`,
  `protolab-ds-context`, `protolab-review`.
- The README of `@romeohunneaul/protolab`: the manifest, the hooks, the panel.
