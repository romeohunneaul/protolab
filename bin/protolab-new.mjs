#!/usr/bin/env node
// Scaffold a prototype in the host project: create <protosDir>/<slug>/index.tsx and register it
// in the manifest. Deterministic, so `protolab-create` never hand-edits the manifest.
//
// Usage: protolab-new <slug> "<Name>" "<Author>" "<Description>"
// Paths come from protolab.config.json at the project root (all optional):
//   { "protosDir": "src/lab/protos", "manifest": "src/lab/manifest.ts",
//     "componentsDir": "src/components/ui", "basePath": "/lab" }

import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, dirname, posix } from "node:path";

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

const [slug, name, author = "", description = ""] = process.argv.slice(2);

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

if (!slug || !name) fail('Usage: protolab-new <slug> "<Name>" "<Author>" "<Description>"');
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail(`slug must be kebab-case (got "${slug}")`);

const manifestPath = join(root, config.manifest);
if (!existsSync(manifestPath)) fail(`manifest not found: ${config.manifest} (set "manifest" in protolab.config.json)`);

const protoDir = join(root, config.protosDir, slug);
if (existsSync(protoDir)) fail(`${config.protosDir}/${slug}/ already exists`);

const manifest = readFileSync(manifestPath, "utf8");
if (manifest.includes(`slug: "${slug}"`)) fail(`"${slug}" is already in the manifest`);

const className = slug.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const q = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

// 1. Component file
const component = `"use client";

// Prototype: ${name}. Reuses the project's real components from ${config.componentsDir}/ — never restyle them.
// To react to a variant axis: const state = useAxis("state");  (add axes with protolab-variant)
// Several views (list → detail)? Declare screens on the entry, then: const { screen, go } = useScreen();

export default function ${className}() {
  return (
    <section className="py-8">
      <h1 className="mb-1 text-2xl font-semibold">${name}</h1>
      <p className="text-sm text-neutral-500">New prototype. Start building.</p>
    </section>
  );
}
`;
mkdirSync(protoDir, { recursive: true });
writeFileSync(join(protoDir, "index.tsx"), component);

// 2. Register in the manifest, before the array's closing bracket
// The array ends with `]);` (defineProtos) or `];` (a plain export). Insert before either.
const at = Math.max(manifest.lastIndexOf("\n]);"), manifest.lastIndexOf("\n];"));
if (at === -1) fail(`could not find the end of the protos array in ${config.manifest} (was its shape changed?)`);

const importPath = posix.join(...relative(dirname(manifestPath), protoDir).split(/[\\/]/));
const entry = `
  {
    slug: "${slug}",
    name: "${q(name)}",
    author: "${q(author)}",
    description: "${q(description)}",
    load: () => import("./${importPath}"),
  },`;
writeFileSync(manifestPath, manifest.slice(0, at) + entry + manifest.slice(at));

console.log(`✓ created ${config.protosDir}/${slug}/index.tsx`);
console.log(`✓ registered "${slug}" in ${config.manifest}`);
console.log(`→ ${config.basePath}/p/${slug}`);
