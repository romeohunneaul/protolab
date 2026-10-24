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
  for (const f of ["protolab.config.json", "src/lab/manifest.ts", "src/app/lab/page.tsx", "src/app/lab/p/[slug]/page.tsx", "src/app/lab/p/[slug]/proto.tsx"]) {
    assert.ok(existsSync(join(host, f)), `${f} should exist`);
    assert.match(out, new RegExp(`✓ created ${f.replace(/[[\]]/g, "\\$&")}`));
  }
  assert.match(read("next.config.ts"), /transpilePackages: \["@romeohunneaul\/protolab"\]/);
  assert.match(read("src/app/globals.css"), /@source ".*node_modules\/@romeohunneaul\/protolab\/src";/);
  assert.equal(JSON.parse(read("package.json")).scripts["update:protolab"], "npm i -D @romeohunneaul/protolab@github:romeohunneaul/protolab && protolab-skills && protolab-check");
  assert.match(read("src/lab/manifest.ts"), /defineProtos\(\[\n\]\);/);
  // Non-interactive: the design-system step detects, writes an empty ds block, and says what to do.
  assert.match(out, /! design system docs not set: run protolab-init in a terminal/);
  assert.deepEqual(JSON.parse(read("protolab.config.json")).ds, { offDs: [] });
  assert.match(out, /npx protolab-check/);
  assert.match(out, /frame-ancestors 'self'/);
});

test("protolab-init is re-runnable: everything is kept, nothing is created twice", () => {
  const { status, out } = run("protolab-init");
  assert.equal(status, 0, out);
  assert.doesNotMatch(out, /✓ created/);
  assert.match(out, /= kept {4}protolab\.config\.json \(ds already set\)/);
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
  for (const s of ["protolab-create", "protolab-variant", "protolab-diverge", "protolab-scenarios", "protolab-ds-context", "protolab-review", "impeccable"]) {
    assert.ok(existsSync(join(host, ".claude/skills", s, "SKILL.md")), `${s} should be installed`);
    assert.match(first.out, new RegExp(`✓ installed \\.claude/skills/${s}`));
  }
  for (const a of ["impeccable-asset-producer", "impeccable-documenter", "impeccable-finish-reviewer"]) {
    assert.ok(existsSync(join(host, ".claude/agents", `${a}.md`)), `${a} should be installed`);
  }
  // A file left from an older copy goes away: the folder is replaced whole.
  writeFileSync(join(host, ".claude/skills/impeccable/reference/live.md"), "stale\n");
  const second = run("protolab-skills");
  assert.match(second.out, /↻ updated \.claude\/skills\/protolab-create/);
  assert.ok(!existsSync(join(host, ".claude/skills/impeccable/reference/live.md")));
});

test("protolab-skills warns when the impeccable plugin is enabled next to its copy", () => {
  // A fake `claude` on the PATH answers `claude plugin list --json`.
  const fakeBin = mkdtempSync(join(tmpdir(), "protolab-claude-"));
  const skills = (plugins) => {
    writeFileSync(join(fakeBin, "claude"), `#!/bin/sh\necho '${JSON.stringify(plugins)}'\n`, { mode: 0o755 });
    return execFileSync(process.execPath, [bin("protolab-skills")], { cwd: host, encoding: "utf8", env: { ...process.env, PATH: fakeBin } });
  };
  try {
    assert.match(skills([{ id: "impeccable@impeccable", enabled: true }]), /! the impeccable plugin is enabled too: disable it \(claude plugin disable impeccable@impeccable\)/);
    assert.doesNotMatch(skills([{ id: "impeccable@impeccable", enabled: false }]), /impeccable plugin/);
    assert.doesNotMatch(skills([]), /impeccable plugin/);
    assert.doesNotMatch(execFileSync(process.execPath, [bin("protolab-skills")], { cwd: host, encoding: "utf8", env: { ...process.env, PATH: "" } }), /impeccable plugin/);
  } finally {
    rmSync(fakeBin, { recursive: true, force: true });
  }
});

test("protolab-init refuses to run outside a host root, and a config that is not JSON", () => {
  const empty = mkdtempSync(join(tmpdir(), "protolab-empty-"));
  try {
    const noPkg = execFileSync(process.execPath, [bin("protolab-init")], { cwd: empty, encoding: "utf8", stdio: "pipe" }).toString();
    assert.fail(`should have failed, got ${noPkg}`);
  } catch (e) {
    assert.equal(e.status, 1);
    assert.match(String(e.stderr), /✗ package\.json not found: run protolab-init from the host project root/);
  }
  writeFileSync(join(empty, "package.json"), "{}");
  try {
    execFileSync(process.execPath, [bin("protolab-init")], { cwd: empty, encoding: "utf8", stdio: "pipe" });
    assert.fail("should have failed");
  } catch (e) {
    assert.match(String(e.stderr), /✗ no app\/ or src\/app\/ folder: is this a Next App Router project\?/);
  }
  mkdirSync(join(empty, "app"));
  writeFileSync(join(empty, "protolab.config.json"), "{ not json");
  for (const name of ["protolab-init", "protolab-new", "protolab-check"]) {
    try {
      execFileSync(process.execPath, [bin(name), "hero", "Hero"], { cwd: empty, encoding: "utf8", stdio: "pipe" });
      assert.fail(`${name} should have failed`);
    } catch (e) {
      assert.equal(e.status, 1, name);
      assert.match(String(e.stderr), /✗ could not read protolab\.config\.json: /, name);
    }
  }
  rmSync(empty, { recursive: true, force: true });
});

test("protolab-init detects Storybook and shadcn, patches a config without ds, and signals a v1 proto page", () => {
  const h = mkdtempSync(join(tmpdir(), "protolab-ds-"));
  mkdirSync(join(h, "src/app/lab/p/[slug]"), { recursive: true });
  mkdirSync(join(h, ".storybook"));
  writeFileSync(join(h, "components.json"), "{}");
  writeFileSync(join(h, "package.json"), "{}");
  writeFileSync(join(h, "protolab.config.json"), JSON.stringify({ basePath: "/lab" }));
  writeFileSync(join(h, "src/app/lab/p/[slug]/page.tsx"), 'const COMPONENTS = Object.fromEntries(PROTOS.map((p) => [p.slug, dynamic(p.load)]));\n');
  const out = execFileSync(process.execPath, [bin("protolab-init")], { cwd: h, encoding: "utf8", stdio: "pipe" });
  assert.match(out, /Storybook detected \(\.storybook\/\)/);
  assert.match(out, /shadcn detected \(components\.json\)/);
  assert.match(out, /✓ patched protolab\.config\.json \(ds\)/);
  assert.deepEqual(JSON.parse(readFileSync(join(h, "protolab.config.json"), "utf8")).ds, { offDs: ["shadcn"] });
  assert.match(out, /! src\/app\/lab\/p\/\[slug\]\/page\.tsx has the v1 shape: delete it and run protolab-init again \(see the migration note\)/);
  assert.ok(!existsSync(join(h, "src/app/lab/p/[slug]/proto.tsx")), "no client module next to a v1 page");
  rmSync(h, { recursive: true, force: true });
});

test("protolab-check passes the example app and an empty manifest", () => {
  const example = join(dirname(fileURLToPath(import.meta.url)), "..", "examples", "next");
  const out = execFileSync(process.execPath, [bin("protolab-check")], { cwd: example, encoding: "utf8", stdio: "pipe" });
  assert.equal(out.trim(), "✓ src/lab/manifest.ts: 2 protos, 0 errors");
  const empty = run("protolab-check"); // the throwaway host: a manifest with no proto yet, hero registered by protolab-new above
  assert.equal(empty.status, 0, empty.out);
  assert.match(empty.out, /✓ src\/lab\/manifest\.ts: 1 proto, 0 errors/);
});

test("protolab-check lists every error in manifest order, rules in order, then exits 1", () => {
  const h = mkdtempSync(join(tmpdir(), "protolab-check-"));
  mkdirSync(join(h, "src/lab/protos/hello"), { recursive: true });
  writeFileSync(join(h, "package.json"), "{}");
  writeFileSync(join(h, "src/lab/manifest.ts"), `import { defineProtos } from "@romeohunneaul/protolab";
export const PROTOS = defineProtos([
  {
    slug: "hello", name: "Hello", author: "", description: "",
    brief: "docs/protos/hello.md",
    axes: [
      { key: "state", label: "State", default: "gone", values: [{ id: "rest", label: "Rest" }, { id: "rest", label: "Again" }, { id: "Rest", label: "Caps", load: () => import("./protos/hello") }] },
      { key: "hero", label: "Hero", kind: "structural", values: [{ id: "bold", label: "Bold" }] },
      { key: "Layout", label: "Layout", kind: "layout" as never, values: [] },
    ],
    screens: [{ key: "list", label: "List" }, { key: "list", label: "Again", steps: ["Address", " "] }, { key: "List", label: "Caps" }],
    scenarios: [{ key: "persona", label: "Persona", default: "ceo", values: [{ id: "daf", label: "DAF" }, { id: "daf", label: "Again" }, { id: "DAF", label: "Caps" }] }, { key: "persona", label: "Again", values: [] }],
    offDs: true,
    load: () => import("./protos/hello"),
  },
  { slug: "hello", name: "Dup", author: "", description: "", load: undefined as never },
  { slug: "Gone", name: "Gone", author: "", description: "", load: () => import("./protos/gone") },
]);
`);
  try {
    execFileSync(process.execPath, [bin("protolab-check")], { cwd: h, encoding: "utf8", stdio: "pipe" });
    assert.fail("should have failed");
  } catch (e) {
    assert.equal(e.status, 1);
    const lines = String(e.stderr).trim().split("\n");
    assert.deepEqual(lines, [
      '✗ hello: brief "docs/protos/hello.md" not found',
      '✗ hello: axis "state": duplicate value id "rest"',
      '✗ hello: axis "state": value id "Rest" is not kebab-case',
      '✗ hello: axis "state": default "gone" is not one of its values',
      '✗ hello: axis "state": state axis, value "Rest" has a load',
      '✗ hello: axis "hero": structural axis, value "bold" has no load',
      '✗ hello: axis key "Layout" is not kebab-case',
      '✗ hello: axis "Layout" has no values',
      '✗ hello: axis "Layout": kind "layout" is not "state" or "structural"',
      '✗ hello: duplicate screen key "list"',
      '✗ hello: screen "list": step 2 has an empty label',
      '✗ hello: screen key "List" is not kebab-case',
      '✗ hello: scenario "persona": duplicate value id "daf"',
      '✗ hello: scenario "persona": value id "DAF" is not kebab-case',
      '✗ hello: scenario "persona": default "ceo" is not one of its values',
      '✗ hello: duplicate scenario key "persona"',
      '✗ hello: scenario "persona" has no values',
      "✗ hello: offDs is true but protolab.config.json declares no ds.offDs",
      '✗ duplicate slug "hello"',
      "✗ hello: load is missing",
      '✗ slug "Gone" is not kebab-case',
      "✗ Gone: src/lab/protos/Gone/ not found",
      "✗ 22 errors in src/lab/manifest.ts",
    ]);
  }
  writeFileSync(join(h, "src/lab/manifest.ts"), "export const PROTOS = [ oops");
  try {
    execFileSync(process.execPath, [bin("protolab-check")], { cwd: h, encoding: "utf8", stdio: "pipe" });
    assert.fail("should have failed");
  } catch (e) {
    assert.match(String(e.stderr), /✗ could not load src\/lab\/manifest\.ts: /);
  }
  rmSync(join(h, "src/lab/manifest.ts"));
  try {
    execFileSync(process.execPath, [bin("protolab-check")], { cwd: h, encoding: "utf8", stdio: "pipe" });
    assert.fail("should have failed");
  } catch (e) {
    assert.match(String(e.stderr), /✗ manifest not found: src\/lab\/manifest\.ts \(set "manifest" in protolab\.config\.json\)/);
  }
  rmSync(h, { recursive: true, force: true });
});
