# Protolab

From a feature intent to a running screen, built with the host project's own components.
The metric is the time between "I have an idea" and "I see it on screen".

A prototype is a React component in your project, registered in one hand-editable manifest,
served at `/lab/p/<slug>`, with **axes** (states, or competing versions of a block), **screens**
and their **steps**, and **scenarios** (data sets), all switchable from a floating panel and
encoded in the URL so a link restores the exact combination. Two agent skills ship with the
package, so Claude Code writes the protos for you: `protolab` for the structure and the data of a
proto, `impeccable` for its design. Each is a set of commands:

| Command | Ask it to |
|---|---|
| `/protolab create` | create a proto from an intent, a brief, the jobs, your design system |
| `/protolab variant` | add states, a competing version of a block (a structural axis), screens and steps |
| `/protolab diverge` | build N approaches of a screen or a block to compare side by side, then keep one |
| `/protolab scenarios` | add data sets: volumes, roles, personas, the worst case |
| `/protolab ds` | read your design system (code, Storybook, Claude Design) before touching anything |
| `/protolab review` | turn the Vercel Comments on your previews into changes |
| `/protolab update` | update the package and its skills, tell you what changed, apply the migrations |
| `/impeccable <command>` | the design pass: `critique`, `audit`, `polish`, `layout`, `typeset`, `clarify`, `animate`, `review-motion`… |

You do not need to type a command: a sentence ("propose 3 approaches of this hero", "test with 500
rows", "update protolab") goes to the right one.

`impeccable` is an adjusted copy of [pbakaus/impeccable](https://github.com/pbakaus/impeccable),
with motion from [emilkowalski/skills](https://github.com/emilkowalski/skills): the commands that
duplicate the lab (live variants, framing) are removed, and `rules/proto.md` keeps its edits within
your design system (ADR 0008, `skills/impeccable/CHANGES.md`). If you also have the impeccable
plugin, `protolab-skills` tells you to disable it.

Works with Next.js App Router (15+), React 19 and Tailwind CSS v4 (the panel and the dashboard
are styled with Tailwind classes).

## Install

Four steps, from the root of a Next App Router project.

### 1. Add the package

```bash
npm i -D github:romeohunneaul/protolab
```

### 2. Wire the lab

```bash
npx protolab-init
```

It starts with the design-system step: it detects a Storybook (`.storybook/`) and shadcn
(`components.json`), asks where your design system is documented (a Storybook URL, a Claude
Design project id, or nothing) and which libraries a proto may use outside it, and writes the
answers in the `ds` block of `protolab.config.json` (without a terminal, it writes what it
detects and tells you to edit the block). Then it writes the manifest (`src/lab/manifest.ts`),
the two pages (`/lab`, `/lab/p/[slug]` plus its client module), `protolab.config.json`, adds
`transpilePackages: ["@romeohunneaul/protolab"]` to your Next config (the package ships
TypeScript source), and an `@source` for the engine to your Tailwind CSS entry (Tailwind skips
`node_modules`, so the panel would render unstyled without it):

```css
@import "tailwindcss";
@source "../../node_modules/@romeohunneaul/protolab/src";
```

Existing files are kept and reported. Paths are
read from `protolab.config.json` if you create it first (defaults shown):

```json
{ "protosDir": "src/lab/protos", "manifest": "src/lab/manifest.ts",
  "componentsDir": "src/components/ui", "basePath": "/lab",
  "ds": { "docs": { "kind": "storybook", "url": "http://localhost:6006" }, "offDs": ["shadcn"] } }
```

`ds.docs` is read by the skills before they write a proto; `ds.offDs` lists the libraries a
proto may use outside your design system, and `protolab-check` refuses `offDs: true` on a proto
when the list is empty. The engine never reads this file at runtime.

<details>
<summary>What protolab-init writes, if you prefer to wire it by hand</summary>

**The manifest** — the single source of truth, yours to own:

```ts
// src/lab/manifest.ts
import { defineProtos } from "@romeohunneaul/protolab";

export const PROTOS = defineProtos([
  // protolab-new appends entries here
]);
```

**The index page**:

```tsx
// src/app/lab/page.tsx
import type { Metadata } from "next";
import { LabDashboard } from "@romeohunneaul/protolab";
import { PROTOS } from "@/lab/manifest";

export const metadata: Metadata = { title: "Lab", robots: { index: false, follow: false } };
export default () => <LabDashboard protos={PROTOS} />;
```

**The proto page**, a server page that checks the slug, and a client module next to it that
imports the manifest and renders the proto (so the loaders never cross the server boundary):

```tsx
// src/app/lab/p/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findProto } from "@romeohunneaul/protolab";
import { PROTOS } from "@/lab/manifest";
import LabProto from "./proto";

export const metadata: Metadata = { title: "Lab", robots: { index: false, follow: false } };
export const generateStaticParams = () => PROTOS.map((p) => ({ slug: p.slug }));

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!findProto(PROTOS, slug)) notFound();
  return <LabProto slug={slug} />;
}
```

```tsx
// src/app/lab/p/[slug]/proto.tsx
"use client";
import { ProtoView, findProto } from "@romeohunneaul/protolab";
import { PROTOS } from "@/lab/manifest";

export default function LabProto({ slug }: { slug: string }) {
  const proto = findProto(PROTOS, slug);
  return proto ? <ProtoView proto={proto} protos={PROTOS} basePath="/lab" /> : null;
}
```

Want an annotation toolbar in dev (e.g. [agentation](https://github.com/benjitaylor/agentation))? Install it in your
project and pass it: `<ProtoView … annotation={<LabAnnotation />} />` with your own `LabAnnotation`
that returns `null` in production. The package stays free of that dependency.

</details>

### 3. Install the skills

```bash
npx protolab-skills
```

It copies `protolab` and `impeccable` into `.claude/skills/`, impeccable's subagents into
`.claude/agents/`, and the proto rule into `.claude/rules/proto.md` (loaded when a file under
`protosDir` is edited). They are copies: `/protolab update` refreshes them. If the impeccable
plugin is enabled in Claude Code, `protolab-skills` tells you to disable it, so each command exists
once.

### 4. Commit, then ask for a proto

Commit `package.json`, `package-lock.json`, `protolab.config.json`, the manifest, the pages and
`.claude/`. Then, in Claude Code opened on the project: "new proto for the reading list", or
`/protolab create`. Once per project, `/impeccable init` writes `PRODUCT.md` from your brief and
`/impeccable document` writes `DESIGN.md` from your code; the design commands read both.

## Use

```bash
npx protolab-init                                              # once: wire the lab
npx protolab-new <slug> "<Name>" "<Author>" "<Description>"   # scaffold + register
npx protolab-check                                             # validate the manifest against the contract
npx protolab-skills                                            # skills into .claude/skills/, subagents into .claude/agents/, proto rules into .claude/rules/
```

`protolab-check` evaluates the manifest (Node 22.6+ with type stripping) and lists every error at
once, in manifest order: unique kebab-case slugs, keys and ids, a default among the values, a
`load` on every value of a structural axis and on none of a state axis, non-empty step labels,
an existing proto folder and brief, `offDs` only with a declared allow-list. Exit code 1 when
anything is wrong, no warnings.

**Adding a variant is a sentence to Claude Code**, in a session opened on your project: "on the
reading list, try the filters in a side panel", "add a compact density", "propose 3 approaches of
this page", "test with 0, 12 and 500 items". The skills decide whether it is a state axis, a
structural axis, approaches or a scenario, write it, and give you the link to compare. You do
not need the vocabulary below; it is here for when you edit a proto by hand. From the lab, the
`Explore` tab writes that sentence for you, with the proto and its current state.

Then build inside `src/lab/protos/<slug>/index.tsx` with your own components. What a proto can
declare on its manifest entry, and how it reads it:

| Declared | Read by the proto | In the URL |
|---|---|---|
| `axes` with `kind: "state"` (the default): modes of the same screen | `useAxis("state")` returns the current value id | `?a.state=empty` |
| `axes` with `kind: "structural"`: one component per value, for a block or the whole screen | `<AxisSlot axis="layout" />` where the block goes; the engine renders the current value's `load` | `?a.layout=cards` |
| `screens`, the first one landing, each with optional `steps` | `const { screen, step, steps, go, next, prev } = useScreen()`; `go(key, step?)`, `next()`, `prev()` each push one history entry, so Back walks the flow | `?screen=checkout&step=2` |
| `scenarios`: data sets, one `data` loader per value, loaded on the client when the value is current | `const { id, data, loading } = useScenario<T>("volume")` | `?s.volume=500` |
| `brief`: a path to the proto's brief, `offDs: true` when the proto uses a library outside the design system | read by the skills and `protolab-check` | |

Values and keys are kebab-case. An absent or unknown value in the URL falls back to the declared
default (the first value unless `default` says otherwise): a stale link never shows an unknown
state. Switching an axis, a scenario or a size replaces the history entry; moving to a screen or
a step pushes one. Everything a proto v1 declared keeps working: `kind` absent means `state`.

Every proto page carries the lab panel: a drawer on the right, collapsible, that leaves the proto
usable. Its header goes back to the index, jumps to another proto, copies the link (`Copy link`)
or the clean link (`Copy clean link`, the same page with `?lab=0`: no tool at all, what you send
outside). Four tabs:

| Tab | What it does | In the URL |
|---|---|---|
| `Variants` | one selector per declared screen, step, axis and scenario | `?screen=…&step=…&a.…&s.…` |
| `Viewport` | `Free size`, the presets `Phone` 390 × 844, `Tablet` 768 × 1024, `Laptop` 1280 × 800, `Desktop` 1440 × 900, or a `Custom` size: the clean page renders in an iframe of exactly that size | `?v=390x844` |
| `Compare` | pick an axis: one cell per value, each an iframe of the clean page at that value, everything else fixed by the link; `Open` leaves with that value | `?compare=density` |
| `Explore` | one field, "what do you want to try?", in your own words ("try the filters in a side panel", "add a compact density", "propose 3 approaches", "test with 0, 12 and 500 items"), and optionally an element you point at, in the page or in the viewport frame. The lab composes a prompt; Claude Code, opened on the host repo, decides with the skills whether it is a new value, an axis, approaches or a scenario, writes it and gives you the comparison link. `Copy prompt`, or `Open in Claude Desktop`. The `+` next to an axis or a scenario in `Variants` opens it prefilled. The lab never changes the code | nothing: a draft is not lab state |

The footer sums up the current state. A gesture made inside a frame (a click that moves to a
screen) is reported to the lab URL, so `Copy link` always copies what is on screen (ADR 0007).
Frames are same-origin iframes: do not block framing of your own pages (`frame-ancestors 'self'`).

## Comments

Protolab ships no comment layer: [Vercel Comments](https://vercel.com/docs/comments) covers it
for teams. Comments are on by default on every preview deployment, with no code: pin a comment
on an element (`c`), reply, resolve. Viewers of a shared link without access to the Vercel
project see the page, not the comments. Every commenter needs a Vercel account.

To comment on `localhost` too, wire the toolbar in the host (`npm i @vercel/toolbar`, then
`vercel link`):

```ts
// next.config.ts
import createWithVercelToolbar from "@vercel/toolbar/plugins/next";
export default createWithVercelToolbar()(nextConfig);
```

```tsx
// app/layout.tsx, inside <body>
import { VercelToolbar } from "@vercel/toolbar/next";
{process.env.NODE_ENV === "development" && <VercelToolbar />}
```

Read and close comments from the terminal: `vercel comments --json`,
`vercel comments inspect <thread> --context`, `vercel comments resolve <thread> -m "…"`.

## Staying up to date

Ask Claude Code "update protolab" (or `/protolab update`). It notes the commit you are on, runs
`npm run update:protolab`, tells you what changed from the changelog, proposes the migrations it
asks for, and proposes the commit. The rest of this section is what it does.

Protolab is installed from GitHub, so npm pins the exact commit in your `package-lock.json`.
`git pull` in your project does not move it, and neither does `npm update`. To follow the engine:

```bash
npm run update:protolab
```

`protolab-init` adds that script to your `package.json`. It runs:

```bash
npm i -D @romeohunneaul/protolab@github:romeohunneaul/protolab && protolab-skills && protolab-check
```

It moves the pin to the latest commit on `main`, recopies the agent skills and the proto rule into
`.claude/` (they are copies, so they do not follow the package on their own), and checks your
manifest against the contract. Commit `package-lock.json` and `.claude/` afterwards, so every clone
of your project runs the same engine. If something breaks, `git checkout package-lock.json` and
`npm ci` bring the previous engine back.

Hosts follow `main`: there are no release tags to pin. What changed, and any migration step, is
under `Unreleased` in `CHANGELOG.md`. Tags and versions come back when the package has hosts whose
authors do not follow its development.

## What's in the box

| Export | What |
|---|---|
| `defineProtos`, `findProto`, `Proto`, `Axis`, `AxisValue`, `Screen`, `Scenario`, `ScenarioValue`, `Loader` | type the manifest, look a proto up |
| `LabDashboard` | the index page, in the lab panel's look and over the host's layout, so it never passes for a proto; server component |
| `ProtoView` | one proto inside its axes, screens and scenarios, with the lab panel; a client component. Pass `protos` (the manifest) to jump between protos, `basePath` if not `/lab`. Optional `annotation` prop for a dev-only toolbar the host provides |
| `useAxis`, `useScreen`, `useScenario`, `AxisSlot` | read an axis; read and change the current screen and step; read a scenario's data; render the current value of a structural axis |
| `VariantProvider`, `LabPanel` | the pieces of `ProtoView`, if you compose your own page (`LabPanel` takes `open` and `onOpenChange`) |

## Copied skills

`skills/impeccable`, `agents/` and `skills/protolab/reference/worst-case.md` are copies of other
repos, pinned in `UPSTREAM.json` and adjusted here. To follow them:

```bash
npm run upstream              # which sources have newer commits, with a compare link
npm run upstream -- --apply   # merge them into the copies, keeping the local changes; move the pins
```

The merge is three-way per file (the pinned upstream, the newer one, the copy): a conflict is left
as markers in the file. Resolve, review the diff, list any new adjustment in `CHANGES.md`, and open
a PR. Hosts get it with `npm run update:protolab`.

## Layout of this repo

| Folder | What |
|---|---|
| `src/` | the engine. Edited here only; consumers never patch it in `node_modules` |
| `bin/` | `protolab-init`, `protolab-new`, `protolab-check`, `protolab-skills` |
| `test/` | `bin.test.mjs` (node:test) and `smoke.spec.ts` (Playwright) |
| `skills/` | the agent skills, copied into consumers by `protolab-skills`: `protolab` (its commands in `reference/`) and `impeccable`, a pinned copy (below) |
| `agents/` | impeccable's subagents, copied into consumers' `.claude/agents/` |
| `UPSTREAM.json`, `scripts/upstream.mjs` | the files copied from other repos and their pinned commits; `npm run upstream` |
| `rules/` | `proto.md`, what a proto is and respects; installed into consumers' `.claude/rules/` by `protolab-skills`, with `paths` set from `protosDir` |
| `examples/next/` | a minimal Next app wired to the local engine (`file:../..`): edits in `src/` show live |
| `docs/adr/` | one short ADR per decision; `CHANGELOG.md` at the root lists what changed, with migration steps |
| `CLAUDE.md` | the rules, verification commands and definition of done for contributors and agents |

Run the example:

```bash
cd examples/next && npm install && npm run dev   # → http://localhost:3000/lab
```

## Verify

```bash
cd examples/next && npm ci && cd ../..   # once
npm run check                            # bin tests, typecheck, example build, browser smoke
```

`npm test` runs `node:test` on the CLIs against a throwaway host. `npm run typecheck` and
`npm run build:example` type and build `examples/next`. `npm run smoke` serves the built example
and drives it with Playwright: `/lab`, one proto, an axis switch, the URL, three sizes. It uses
the Chromium that Playwright finds on the machine (`npx playwright install chromium` if none).

## License

MIT, except the copied files listed in `UPSTREAM.json`: `skills/impeccable/` and `agents/` come
from [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0, `LICENSE` and
`NOTICE.md` in that folder, changes in `CHANGES.md`); its motion references and
`skills/protolab/reference/worst-case.md` come from
[emilkowalski/skills](https://github.com/emilkowalski/skills) (MIT), with their notice.
