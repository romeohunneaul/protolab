# Protolab

From a feature intent to a running screen, built with the host project's own components.
The metric is the time between "I have an idea" and "I see it on screen".

A prototype is a React component in your project, registered in one hand-editable manifest,
served at `/lab/p/<slug>`, with **axes** (states, or competing versions of a block), **screens**
and their **steps**, and **scenarios** (data sets), all switchable from a floating panel and
encoded in the URL so a link restores the exact combination. Three agent skills ship
with the package: create a proto, add an axis, read your design system before touching anything.

Works with Next.js App Router (15+), React 19 and Tailwind CSS v4 (the panel and the dashboard
are styled with Tailwind classes).

## Install

```bash
npm i -D github:romeohunneaul/protolab
```

Then, from the project root:

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

## Use

```bash
npx protolab-init                                              # once: wire the lab
npx protolab-new <slug> "<Name>" "<Author>" "<Description>"   # scaffold + register
npx protolab-check                                             # validate the manifest against the contract
npx protolab-skills                                            # skills into .claude/skills/, proto rules into .claude/rules/
```

`protolab-check` evaluates the manifest (Node 22.6+ with type stripping) and lists every error at
once, in manifest order: unique kebab-case slugs, keys and ids, a default among the values, a
`load` on every value of a structural axis and on none of a state axis, non-empty step labels,
an existing proto folder and brief, `offDs` only with a declared allow-list. Exit code 1 when
anything is wrong, no warnings.

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

Every proto page carries the lab panel (bottom right, collapsible): back to the index, jump to
another proto, then the proto's screen, step, axes and scenarios, and a link that restores the
exact combination.

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

Protolab is installed from GitHub, so npm pins the exact commit in your `package-lock.json`.
`git pull` in your project does not move it, and neither does `npm update`. To follow the engine:

```bash
npm run update:protolab
```

`protolab-init` adds that script to your `package.json`. It runs:

```bash
npm i -D @romeohunneaul/protolab@github:romeohunneaul/protolab && npx protolab-skills
```

The first half moves the pin to the latest commit on `main`. The second recopies the agent skills
into `.claude/skills/`: they are copies, so they do not follow the package on their own. Commit
`package-lock.json` and `.claude/skills/` afterwards, so every clone of your project runs the same
version.

Releases are tagged `vX.Y.Z`, one per lot, with their notes in `CHANGELOG.md`. Pin a tag rather
than `main`:

```bash
npm i -D github:romeohunneaul/protolab#v0.1.0
```

A range works too (`github:romeohunneaul/protolab#semver:^0.1.0`) if a bot such as Renovate opens
your update PRs.

## What's in the box

| Export | What |
|---|---|
| `defineProtos`, `findProto`, `Proto`, `Axis`, `AxisValue`, `Screen`, `Scenario`, `ScenarioValue`, `Loader` | type the manifest, look a proto up |
| `LabDashboard` | the index page body, server component |
| `ProtoView` | one proto inside its axes, screens and scenarios, with the lab panel; a client component. Pass `protos` (the manifest) to jump between protos, `basePath` if not `/lab`. Optional `annotation` prop for a dev-only toolbar the host provides |
| `useAxis`, `useScreen`, `useScenario`, `AxisSlot` | read an axis; read and change the current screen and step; read a scenario's data; render the current value of a structural axis |
| `VariantProvider`, `LabPanel` | the pieces of `ProtoView`, if you compose your own page |

## Layout of this repo

| Folder | What |
|---|---|
| `src/` | the engine. Edited here only; consumers never patch it in `node_modules` |
| `bin/` | `protolab-init`, `protolab-new`, `protolab-check`, `protolab-skills` |
| `test/` | `bin.test.mjs` (node:test) and `smoke.spec.ts` (Playwright) |
| `skills/` | the agent skills, copied into consumers by `protolab-skills` |
| `rules/` | `proto.md`, what a proto is and respects; installed into consumers' `.claude/rules/` by `protolab-skills`, with `paths` set from `protosDir` |
| `examples/next/` | a minimal Next app wired to the local engine (`file:../..`): edits in `src/` show live |
| `docs/adr/` | one short ADR per decision; `CHANGELOG.md` at the root lists each tagged release |
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

MIT
