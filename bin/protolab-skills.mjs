#!/usr/bin/env node
// Copy the protolab skills into the host project's .claude/skills/, so the agent knows how to
// create a proto, add an axis, and read the design system; and the proto conventions into
// .claude/rules/proto.md. Then check that impeccable, the design skill the protos are critiqued
// and polished with, is there: the plugin, or a copy in the project. Re-run after upgrading the
// package.
//
// Usage: protolab-skills

import { execFileSync } from "node:child_process";
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

// impeccable: the plugin (skill, subagents, hooks, in every project) or a copy in this project,
// not both. Only reported: the protos work without it.
const copy = existsSync(join(root, ".claude", "skills", "impeccable", "SKILL.md"));
let plugin;
try {
  const list = JSON.parse(execFileSync("claude", ["plugin", "list", "--json"], { cwd: root, encoding: "utf8", stdio: "pipe", timeout: 30000 }));
  plugin = list.find((p) => p.id.startsWith("impeccable@")) ?? null;
} catch {
  plugin = undefined; // no claude CLI, or an output it could not give
}
const enabled = plugin && (plugin.enabled || plugin.projectEnabled);
if (enabled && copy) console.log(`! impeccable is both the plugin ${plugin.id} and a copy in .claude/skills/impeccable: keep one`);
else if (enabled) console.log(`✓ impeccable: plugin ${plugin.id}`);
else if (copy) console.log("✓ impeccable: copy in .claude/skills/impeccable");
else {
  if (plugin) console.log(`! impeccable plugin ${plugin.id} is disabled: claude plugin enable ${plugin.id}`);
  else console.log(`! impeccable not found${plugin === undefined ? " (claude CLI unavailable, plugin not checked)" : ""}: the design pass on protos (critique, audit, polish) uses it. Install one:
  claude plugin marketplace add pbakaus/impeccable && claude plugin install impeccable@impeccable   # the plugin, for all your projects
  npx impeccable install --providers=claude --scope=project                                        # or a copy in this project`);
}
