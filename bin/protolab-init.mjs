#!/usr/bin/env node
// Wire protolab into a Next.js App Router project: the manifest, the lab index page, the proto
// page, protolab.config.json, `transpilePackages` in next.config.ts, and the Tailwind `@source`
// for the engine in the global CSS. Existing files are left
// alone and reported. Run from the project root; re-runnable.
//
// Usage: protolab-init

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const root = process.cwd();
const config = {
  protosDir: "src/lab/protos",
  manifest: "src/lab/manifest.ts",
  componentsDir: "src/components/ui",
  basePath: "/lab",
  ...(existsSync(join(root, "protolab.config.json"))
    ? JSON.parse(readFileSync(join(root, "protolab.config.json"), "utf8"))
    : {}),
};
const appDir = existsSync(join(root, "src/app")) ? "src/app" : "app";
const pagesDir = join(appDir, config.basePath.replace(/^\//, ""));
const alias = config.manifest.replace(/^src\//, "@/").replace(/\.tsx?$/, "");
const importManifest = config.manifest.startsWith("src/") ? alias : `@/../${config.manifest.replace(/\.tsx?$/, "")}`;

const write = (rel, content) => {
  const abs = join(root, rel);
  if (existsSync(abs)) return console.log(`= kept    ${rel}`);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  console.log(`✓ created ${rel}`);
};

write("protolab.config.json", JSON.stringify(config, null, 2) + "\n");

write(config.manifest, `import { defineProtos } from "@romeohunneaul/protolab";

/** Source of truth for the lab. \`protolab-new\` appends entries here; nothing else registers a proto. */
export const PROTOS = defineProtos([
]);
`);

write(join(pagesDir, "page.tsx"), `import type { Metadata } from "next";
import { LabDashboard } from "@romeohunneaul/protolab";
import { PROTOS } from "${importManifest}";

// The lab is a workshop, not part of the product: keep it out of search.
export const metadata: Metadata = { title: "Lab", robots: { index: false, follow: false } };

export default function LabPage() {
  return <LabDashboard protos={PROTOS} basePath="${config.basePath}" />;
}
`);

write(join(pagesDir, "p/[slug]/page.tsx"), `import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { ProtoView, findProto } from "@romeohunneaul/protolab";
import { PROTOS } from "${importManifest}";

export const metadata: Metadata = { title: "Lab", robots: { index: false, follow: false } };
export const generateStaticParams = () => PROTOS.map((p) => ({ slug: p.slug }));

// dynamic() must run at module scope, not during render.
const COMPONENTS = Object.fromEntries(PROTOS.map((p) => [p.slug, dynamic(p.load)]));

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const proto = findProto(PROTOS, slug);
  if (!proto) notFound();
  return <ProtoView proto={proto} Component={COMPONENTS[slug]} protos={PROTOS} basePath="${config.basePath}" />;
}
`);

// next.config: add transpilePackages when the file has the usual shape; otherwise say what to add.
const nextConfig = ["next.config.ts", "next.config.mjs", "next.config.js"].map((f) => join(root, f)).find(existsSync);
const line = 'transpilePackages: ["@romeohunneaul/protolab"],';
if (nextConfig && readFileSync(nextConfig, "utf8").includes("@romeohunneaul/protolab")) {
  console.log(`= kept    ${nextConfig.slice(root.length + 1)} (transpilePackages already set)`);
} else if (nextConfig && /const nextConfig(: NextConfig)? = \{/.test(readFileSync(nextConfig, "utf8"))) {
  const src = readFileSync(nextConfig, "utf8");
  writeFileSync(nextConfig, src.replace(/const nextConfig(: NextConfig)? = \{/, (m) => `${m}\n  ${line}`));
  console.log(`✓ patched ${nextConfig.slice(root.length + 1)} (${line})`);
} else {
  console.log(`! add to your Next config: ${line}`);
}

// Tailwind v4 skips node_modules, so the engine's classes (panel, dashboard) need an @source.
const css = [join(appDir, "globals.css"), "src/styles/globals.css", "styles/globals.css"]
  .map((f) => join(root, f))
  .find((f) => existsSync(f) && readFileSync(f, "utf8").includes("tailwindcss"));
const engineSrc = join(root, "node_modules/@romeohunneaul/protolab/src");
if (!css) {
  console.log(`! add to your Tailwind CSS entry: @source "<path to>/node_modules/@romeohunneaul/protolab/src";`);
} else if (readFileSync(css, "utf8").includes("@romeohunneaul/protolab")) {
  console.log(`= kept    ${css.slice(root.length + 1)} (@source already set)`);
} else {
  const source = `@source "${relative(dirname(css), engineSrc)}";`;
  writeFileSync(css, readFileSync(css, "utf8").replace(/(@import ["']tailwindcss["'];?)/, `$1\n${source}`));
  console.log(`✓ patched ${css.slice(root.length + 1)} (${source})`);
}

console.log(`
Next:
  npx protolab-skills                                   # agent skills into .claude/skills/
  npx protolab-new <slug> "<Name>" "<Author>" "<Desc>"  # first proto → ${config.basePath}/p/<slug>`);
