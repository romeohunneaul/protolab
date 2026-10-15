#!/usr/bin/env node
// Copy the protolab skills into the host project's .claude/skills/, so the agent knows how to
// create a proto, add an axis, and read the design system; and the proto conventions into
// .claude/rules/proto.md. Re-run after upgrading the package.
//
// Usage: protolab-skills

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkg = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = process.cwd();
const src = join(pkg, "skills");
const dest = join(root, ".claude", "skills");
mkdirSync(dest, { recursive: true });

for (const skill of readdirSync(src)) {
  const existed = existsSync(join(dest, skill));
  cpSync(join(src, skill), join(dest, skill), { recursive: true });
  console.log(`${existed ? "↻ updated" : "✓ installed"} .claude/skills/${skill}`);
}

// The proto conventions, loaded by Claude Code when a file under the protos dir is edited.
const config = existsSync(join(root, "protolab.config.json")) ? JSON.parse(readFileSync(join(root, "protolab.config.json"), "utf8")) : {};
const protosDir = (config.protosDir ?? "src/lab/protos").replace(/\/$/, "");
const rule = readFileSync(join(pkg, "rules", "proto.md"), "utf8").replace(/^paths: .*$/m, `paths: ${protosDir}/**/*.tsx`);
const rulePath = join(root, ".claude", "rules", "proto.md");
const ruleExisted = existsSync(rulePath);
mkdirSync(dirname(rulePath), { recursive: true });
writeFileSync(rulePath, rule);
console.log(`${ruleExisted ? "↻ updated" : "✓ installed"} .claude/rules/proto.md (paths: ${protosDir}/**/*.tsx)`);
