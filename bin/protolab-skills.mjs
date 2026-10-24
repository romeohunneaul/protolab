#!/usr/bin/env node
// Copy the agent skills into the host project's .claude/skills/ (protolab, and impeccable for the
// design pass), impeccable's subagents into .claude/agents/, and the proto conventions into
// .claude/rules/proto.md. A skill folder is replaced whole, so a file removed from the package
// goes away, and the skills the package no longer ships are removed. Re-run after upgrading the
// package.
//
// Usage: protolab-skills

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkg = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = process.cwd();
const src = join(pkg, "skills");
const dest = join(root, ".claude", "skills");
mkdirSync(dest, { recursive: true });

// The six skills that became the commands of `protolab`.
for (const old of ["create", "variant", "diverge", "scenarios", "ds-context", "review"].map((n) => `protolab-${n}`)) {
  if (!existsSync(join(dest, old))) continue;
  rmSync(join(dest, old), { recursive: true, force: true });
  console.log(`✗ removed .claude/skills/${old} (now /protolab)`);
}

for (const skill of readdirSync(src)) {
  const existed = existsSync(join(dest, skill));
  rmSync(join(dest, skill), { recursive: true, force: true });
  cpSync(join(src, skill), join(dest, skill), { recursive: true });
  console.log(`${existed ? "↻ updated" : "✓ installed"} .claude/skills/${skill}`);
}

const agents = join(root, ".claude", "agents");
mkdirSync(agents, { recursive: true });
for (const agent of readdirSync(join(pkg, "agents"))) {
  const existed = existsSync(join(agents, agent));
  cpSync(join(pkg, "agents", agent), join(agents, agent));
  console.log(`${existed ? "↻ updated" : "✓ installed"} .claude/agents/${agent}`);
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

// The project copy of impeccable is protolab's: the plugin, if enabled too, doubles every command.
try {
  const list = JSON.parse(execFileSync("claude", ["plugin", "list", "--json"], { cwd: root, encoding: "utf8", stdio: "pipe", timeout: 30000 }));
  const plugin = list.find((p) => p.id?.startsWith("impeccable@") && (p.enabled || p.projectEnabled));
  if (plugin) console.log(`! the impeccable plugin is enabled too: disable it (claude plugin disable ${plugin.id}), protolab ships its own copy`);
} catch {
  // no claude CLI: nothing to compare with
}
