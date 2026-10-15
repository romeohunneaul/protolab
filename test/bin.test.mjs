// The three CLIs against a throwaway host: what they write, what they keep, what they refuse.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const bin = (name) => join(dirname(fileURLToPath(import.meta.url)), "..", "bin", `${name}.mjs`);
let host;

const run = (name, ...args) => {
  try {
    return { status: 0, out: execFileSync(process.execPath, [bin(name), ...args], { cwd: host, encoding: "utf8", stdio: "pipe" }) };
  } catch (e) {
    return { status: e.status, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
};
const read = (rel) => readFileSync(join(host, rel), "utf8");

before(() => {
  host = mkdtempSync(join(tmpdir(), "protolab-host-"));
  mkdirSync(join(host, "src/app"), { recursive: true });
  writeFileSync(join(host, "package.json"), JSON.stringify({ name: "host", private: true, scripts: { dev: "next dev" } }, null, 2));
  writeFileSync(join(host, "src/app/globals.css"), '@import "tailwindcss";\n');
  writeFileSync(join(host, "next.config.ts"), 'import type { NextConfig } from "next";\n\nconst nextConfig: NextConfig = {\n};\nexport default nextConfig;\n');
});
after(() => rmSync(host, { recursive: true, force: true }));

test("protolab-init wires the host: config, manifest, two pages, next.config, Tailwind @source, update script", () => {
  const { status, out } = run("protolab-init");
  assert.equal(status, 0, out);
  for (const f of ["protolab.config.json", "src/lab/manifest.ts", "src/app/lab/page.tsx", "src/app/lab/p/[slug]/page.tsx"]) {
    assert.ok(existsSync(join(host, f)), `${f} should exist`);
    assert.match(out, new RegExp(`✓ created ${f.replace(/[[\]]/g, "\\$&")}`));
  }
  assert.match(read("next.config.ts"), /transpilePackages: \["@romeohunneaul\/protolab"\]/);
  assert.match(read("src/app/globals.css"), /@source ".*node_modules\/@romeohunneaul\/protolab\/src";/);
  assert.equal(JSON.parse(read("package.json")).scripts["update:protolab"], "npm i -D @romeohunneaul/protolab@github:romeohunneaul/protolab && protolab-skills");
  assert.match(read("src/lab/manifest.ts"), /defineProtos\(\[\n\]\);/);
});

test("protolab-init is re-runnable: everything is kept, nothing is created twice", () => {
  const { status, out } = run("protolab-init");
  assert.equal(status, 0, out);
  assert.doesNotMatch(out, /✓ created/);
  assert.match(out, /= kept {4}protolab\.config\.json/);
  assert.match(out, /= kept {4}next\.config\.ts \(transpilePackages already set\)/);
  assert.match(out, /= kept {4}src\/app\/globals\.css \(@source already set\)/);
  assert.match(out, /= kept {4}package\.json \(update:protolab already set\)/);
});

test("protolab-new scaffolds the component and registers the proto", () => {
  const { status, out } = run("protolab-new", "hero", "Hero", "Me", 'A "quoted" description');
  assert.equal(status, 0, out);
  const component = read("src/lab/protos/hero/index.tsx");
  assert.match(component, /^"use client";/);
  assert.match(component, /export default function Hero\(\)/);
  const manifest = read("src/lab/manifest.ts");
  assert.match(manifest, /slug: "hero",\n\s+name: "Hero",\n\s+author: "Me",\n\s+description: "A \\"quoted\\" description",\n\s+load: \(\) => import\("\.\/protos\/hero"\),/);
  assert.match(out, /→ \/lab\/p\/hero/);
});

test("protolab-new refuses a slug that is not kebab-case, a duplicate, and a missing name", () => {
  const bad = run("protolab-new", "Hero", "Hero");
  assert.equal(bad.status, 1);
  assert.match(bad.out, /slug must be kebab-case/);
  const dup = run("protolab-new", "hero", "Hero again");
  assert.equal(dup.status, 1);
  assert.match(dup.out, /already exists|already in the manifest/);
  const usage = run("protolab-new", "only-slug");
  assert.equal(usage.status, 1);
  assert.match(usage.out, /Usage: protolab-new/);
  assert.ok(!existsSync(join(host, "src/lab/protos/only-slug")));
});

test("protolab-skills copies the agent skills into .claude/skills/", () => {
  const first = run("protolab-skills");
  assert.equal(first.status, 0, first.out);
  for (const s of ["protolab-create", "protolab-variant", "protolab-ds-context"]) {
    assert.ok(existsSync(join(host, ".claude/skills", s, "SKILL.md")), `${s} should be installed`);
    assert.match(first.out, new RegExp(`✓ installed \\.claude/skills/${s}`));
  }
  const second = run("protolab-skills");
  assert.match(second.out, /↻ updated \.claude\/skills\/protolab-create/);
});
