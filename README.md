# Protolab

From a feature intent to a running screen, built with the host project's own components.
The metric is the time between "I have an idea" and "I see it on screen".

A prototype is a React component in your project, registered in one hand-editable manifest,
served at `/lab/p/<slug>`, with **axes** (state, layout, theme) switchable from a floating
panel and encoded in the URL so a link restores the exact combination. Three agent skills ship
with the package: create a proto, add an axis, read your design system before touching anything.

Works with Next.js App Router (15+) and React 19.

## Install

```bash
npm i -D github:romeohunneaul/protolab
```

The package ships TypeScript source. Tell Next to compile it:

```ts
// next.config.ts
const nextConfig = { transpilePackages: ["@romeohunneaul/protolab"] };
```

Optional: `protolab.config.json` at the project root. Defaults shown.

```json
{ "protosDir": "src/lab/protos", "manifest": "src/lab/manifest.ts",
  "componentsDir": "src/components/ui", "basePath": "/lab" }
```

## Wire three files

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

## Use

```bash
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
| `ProtoView` | one proto inside its axes, with the switcher and the dev-only annotation toolbar |
| `VariantProvider`, `VariantSwitcher`, `useAxis`, `Axis` | the axes model, if you compose your own page |
| `LabAnnotation` | wraps [agentation](https://github.com/benjitaylor/agentation) when installed (optional peer); renders nothing in production |

## Layout of this repo

| Folder | What |
|---|---|
| `src/` | the engine. Edited here only; consumers never patch it in `node_modules` |
| `bin/` | `protolab-new`, `protolab-skills` |
| `skills/` | the agent skills, copied into consumers by `protolab-skills` |
| `examples/` | a minimal Next app showing the engine — to come |

## License

MIT
