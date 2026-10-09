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
  return <ProtoView proto={proto} Component={COMPONENTS[slug]} />;
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
npx protolab-skills                                            # copy the skills into .claude/skills/
```

Then build inside `src/lab/protos/<slug>/index.tsx` with your own components. Read an axis with
`useAxis("state")`; declare axes on the manifest entry (see the `protolab-variant` skill).

## What's in the box

| Export | What |
|---|---|
| `defineProtos`, `findProto`, `Proto` | type the manifest, look a proto up |
| `LabDashboard` | the index page body, server component |
| `ProtoView` | one proto inside its axes, with the switcher. Optional `annotation` prop for a dev-only toolbar the host provides |
| `VariantProvider`, `VariantSwitcher`, `useAxis`, `Axis` | the axes model, if you compose your own page |

## Layout of this repo

| Folder | What |
|---|---|
| `src/` | the engine. Edited here only; consumers never patch it in `node_modules` |
| `bin/` | `protolab-init`, `protolab-new`, `protolab-skills` |
| `skills/` | the agent skills, copied into consumers by `protolab-skills` |
| `examples/next/` | a minimal Next app wired to the local engine (`file:../..`): edits in `src/` show live |

Run the example:

```bash
cd examples/next && npm install && npm run dev   # → http://localhost:3000/lab
```

## License

MIT
