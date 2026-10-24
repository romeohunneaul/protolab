---
name: protolab-ds-context
description: Gathers the design system a proto may use - the host's coded components (componentsDir of protolab.config.json, with their stories), the documentation declared in the ds block (a Storybook, a Claude Design project, or none) and the libraries allowed outside the design system. Use BEFORE writing or changing a proto, when the user says "quels composants j'ai", "récupère le storybook", "prototype avec le DS", and whenever protolab-create, protolab-variant or protolab-diverge must pick a component. Never invent a component or a prop - what this skill does not find does not exist.
---

# protolab: design system context

> You know a component only after reading its file in the host's components folder. Training
> data is never a source: if you have not read the file, you do not know.

## 1. Read the config

`protolab.config.json` at the host root:

- `componentsDir` (default `src/components/ui`): the coded components, the primary source.
- `ds.docs`: where the design system is documented beyond the code.
- `ds.offDs`: libraries a proto may use outside the design system (`["shadcn"]`). Absent or
  empty: none.

## 2. The coded components, primary source

- List them: `ls <componentsDir>` (skip `*.stories.*`, `*.test.*`).
- For each component the task needs, read its source (props, variants) **and** its stories when
  they exist (the states the designer chose to show: the usage contract).
- **How the protos import them**: read an existing proto or the host's own pages and copy the
  import. When `componentsDir` sits inside `node_modules` (a design-system package), import from
  the package name (`import { Button } from "@scope/ds"`), never from a file path.
- The host's utility classes and tokens live in its global stylesheet (often
  `src/app/globals.css`): reuse them, never hard-code a colour.

## 3. The declared documentation, secondary

| `ds.docs` | What to read |
|---|---|
| `{ kind: "storybook", url }` | `<url>/index.json`: the list of components and their stories. A local Storybook (`localhost`) may not be running: if the fetch fails, say so and rely on the code |
| `{ kind: "claude-design", projectId }` | The project through the `DesignSync` tool, read only (`list_files`, `get_file`): `tokens.json`, the README, the previews. The components a proto uses stay those of `componentsDir` |
| absent | The code only |

Consult it when an intention has no coded equivalent yet, to decide whether to compose with what
exists or to report a gap.

A `DESIGN.md` at the root (written by `impeccable document`) describes the visual language: the
tokens' roles, the type scale, the character of the components. Read it when it exists; the
components a proto uses stay those of `componentsDir`.

## 4. Hand over

A short list: the components relevant to the task with their real props and states, how to
import them, and the **gaps** (what the task needs and no component covers: no `Tabs`, no side
panel). A gap is a product signal, not an invitation to write custom CSS:

- compose with existing components when a faithful composition exists (chips as tabs), and say so;
- or use a library listed in `ds.offDs`, and mark the proto `offDs: true` in the manifest;
- otherwise ask (`AskUserQuestion`) whether a fallback is acceptable.

## What this skill does not do

It writes no code. It prepares `protolab-create`, `protolab-variant` and `protolab-diverge`.
Custom CSS is a last resort, never without the user's explicit go.
