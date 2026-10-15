# Protolab

From a feature intent to a running screen, built with the host project's own components.
The metric is the time between "I have an idea" and "I see it on screen".

A prototype is a React component in your project, registered in one hand-editable manifest,
served at `/lab/p/<slug>`, with **axes** (state, layout, theme) switchable from a floating
panel and encoded in the URL so a link restores the exact combination. Three agent skills ship
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

It writes the manifest (`src/lab/manifest.ts`), the two pages (`/lab`, `/lab/p/[slug]`),
`protolab.config.json`, and adds `transpilePackages: ["@romeohunneaul/protolab"]` to your Next
config (the package ships TypeScript source), and an `@source` for the engine to your Tailwind
CSS entry (Tailwind skips `node_modules`, so the panel would render unstyled without it):

```css
@import "tailwindcss";
@source "../../node_modules/@romeohunneaul/protolab/src";
```

Existing files are kept and reported. Paths are
read from `protolab.config.json` if you create it first (defaults shown):

```json
{ "protosDir": "src/lab/protos", "manifest": "src/lab/manifest.ts",
  "componentsDir": "src/components/ui", "basePath": "/lab" }
```

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

**The proto page**:

```tsx
// src/app/lab/p/[slug]/page.tsx
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { ProtoView, findProto } from "@romeohunneaul/protolab";
import { PROTOS } from "@/lab/manifest";

export const metadata: Metadata = { title: "Lab", robots: { index: false, follow: false } };
export const generateStaticParams = () => PROTOS.map((p) => ({ slug: p.slug }));

// dynamic() must run at module scope, not during render.
const COMPONENTS = Object.fromEntries(PROTOS.map((p) => [p.slug, dynamic(p.load)]));

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const proto = findProto(PROTOS, slug);
  if (!proto) notFound();
  return <ProtoView proto={proto} Component={COMPONENTS[slug]} protos={PROTOS} basePath="/lab" />;
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
npx protolab-skills                                            # skills into .claude/skills/, proto rules into .claude/rules/
```

Then build inside `src/lab/protos/<slug>/index.tsx` with your own components. Read an axis with
`useAxis("state")`; declare axes on the manifest entry (see the `protolab-variant` skill). For a
proto with several views, declare `screens` on the entry and move with
`const { screen, go } = useScreen()`: each screen gets its own URL (`?screen=<key>`) and the
browser's Back button walks the flow.

Every proto page carries the lab panel (bottom right, collapsible): back to the index, jump to
another proto, then the proto's screen and axes, and a link that restores the exact combination.

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
| `defineProtos`, `findProto`, `Proto` | type the manifest, look a proto up |
| `LabDashboard` | the index page body, server component |
| `ProtoView` | one proto inside its axes and screens, with the lab panel. Pass `protos` (the manifest) to jump between protos, `basePath` if not `/lab`. Optional `annotation` prop for a dev-only toolbar the host provides |
| `useAxis`, `useScreen`, `Axis`, `Screen` | read an axis; read and change the current screen |
| `VariantProvider`, `LabPanel` | the pieces of `ProtoView`, if you compose your own page |

## Layout of this repo

| Folder | What |
|---|---|
| `src/` | the engine. Edited here only; consumers never patch it in `node_modules` |
| `bin/` | `protolab-init`, `protolab-new`, `protolab-skills` |
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
