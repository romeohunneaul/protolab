#!/usr/bin/env node
// Wire protolab into a Next.js App Router project: the design-system step of the config, the
// manifest, the lab index page, the proto page (a server page plus a client module next to it),
// `transpilePackages` in next.config.ts, the Tailwind `@source` for the engine, and an
// `update:protolab` script. Existing files are kept and reported. Run from the project root;
// re-runnable.
//
// Usage: protolab-init

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { createInterface } from "node:readline/promises";
import { fail, readConfig } from "./_config.mjs";

const root = process.cwd();
if (!existsSync(join(root, "package.json"))) fail("package.json not found: run protolab-init from the host project root");
const appDir = ["src/app", "app"].find((d) => existsSync(join(root, d)));
if (!appDir) fail("no app/ or src/app/ folder: is this a Next App Router project?");

const { _exists: configExists, ...config } = readConfig(root);

// --- The design-system step: where the design system is documented, and what is allowed outside it.
if (config.ds === undefined) {
  const storybook = existsSync(join(root, ".storybook"));
  const shadcn = existsSync(join(root, "components.json"));
  if (storybook) console.log("Storybook detected (.storybook/)");
  if (shadcn) console.log("shadcn detected (components.json)");
  const ds = { offDs: shadcn ? ["shadcn"] : [] };
  if (process.stdin.isTTY && process.stdout.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const ask = async (question, fallback) => (await rl.question(`${question} [${fallback}]: `)).trim() || fallback;
    const url = async () => ({ kind: "storybook", url: await ask("Storybook URL", "http://localhost:6006") });
    const projectId = async () => {
      const id = (await rl.question("Claude Design project id: ")).trim();
      return id ? { kind: "claude-design", projectId: id } : undefined;
    };
    let answer = storybook ? await ask("Storybook URL", "http://localhost:6006") : await ask("Design system docs? (storybook / claude-design / none)", "none");
    if (storybook && answer !== "none" && answer !== "claude-design") ds.docs = { kind: "storybook", url: answer };
    else if (answer === "storybook") ds.docs = await url();
    else if (answer === "claude-design") ds.docs = await projectId();
    const libs = await ask("Libraries allowed outside the design system (comma-separated)", ds.offDs.join(", "));
    ds.offDs = libs.split(",").map((s) => s.trim()).filter(Boolean);
    rl.close();
  } else {
    console.log("! design system docs not set: run protolab-init in a terminal, or edit the ds block of protolab.config.json");
  }
  config.ds = ds;
  if (configExists) {
    writeFileSync(join(root, "protolab.config.json"), JSON.stringify(config, null, 2) + "\n");
    console.log("✓ patched protolab.config.json (ds)");
  }
} else if (configExists) {
  console.log("= kept    protolab.config.json (ds already set)");
}

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

if (!configExists) write("protolab.config.json", JSON.stringify(config, null, 2) + "\n");

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

// The proto page: a server page that checks the slug, and a client module next to it that imports
// the manifest and renders the proto, so the loaders never cross the server boundary.
const protoPage = join(pagesDir, "p/[slug]/page.tsx");
const protoClient = join(pagesDir, "p/[slug]/proto.tsx");
const v1Shape = existsSync(join(root, protoPage)) && !existsSync(join(root, protoClient)) && /dynamic\(|Component=\{/.test(readFileSync(join(root, protoPage), "utf8"));
if (v1Shape) {
  console.log(`! ${protoPage} has the v1 shape: delete it and run protolab-init again (see the migration note)`);
} else {
  write(protoPage, `import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findProto } from "@romeohunneaul/protolab";
import { PROTOS } from "${importManifest}";
import LabProto from "./proto";

export const metadata: Metadata = { title: "Lab", robots: { index: false, follow: false } };
export const generateStaticParams = () => PROTOS.map((p) => ({ slug: p.slug }));

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!findProto(PROTOS, slug)) notFound();
  return <LabProto slug={slug} />;
}
`);
  write(protoClient, `"use client";

import { ProtoView, findProto } from "@romeohunneaul/protolab";
import { PROTOS } from "${importManifest}";

export default function LabProto({ slug }: { slug: string }) {
  const proto = findProto(PROTOS, slug);
  return proto ? <ProtoView proto={proto} protos={PROTOS} basePath="${config.basePath}" /> : null;
}
`);
}

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

// package.json: one script to follow the engine (bump to the latest commit, refresh the skills).
const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.scripts ??= {};
if (pkg.scripts["update:protolab"]) {
  console.log("= kept    package.json (update:protolab already set)");
} else {
  pkg.scripts["update:protolab"] = "npm i -D @romeohunneaul/protolab@github:romeohunneaul/protolab && protolab-skills && protolab-check";
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("✓ patched package.json (script update:protolab)");
}

console.log(`
Next:
  npx protolab-skills                                   # agent skills into .claude/skills/, proto rules into .claude/rules/, checks impeccable
  npx protolab-new <slug> "<Name>" "<Author>" "<Desc>"  # first proto → ${config.basePath}/p/<slug>
  npx protolab-check                                    # validate the manifest against the contract
  npm run update:protolab                               # later: follow the engine (main), refresh the skills, check
! the lab renders protos in same-origin iframes (viewport, comparison): do not block framing of your own pages (frame-ancestors 'self')`);
