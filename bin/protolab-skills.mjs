#!/usr/bin/env node
// Copy the protolab skills into the host project's .claude/skills/, so the agent knows how to
// create a proto, add an axis, and read the design system. Re-run after upgrading the package.
//
// Usage: protolab-skills

import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "skills");
const dest = join(process.cwd(), ".claude", "skills");
mkdirSync(dest, { recursive: true });

for (const skill of readdirSync(src)) {
  const existed = existsSync(join(dest, skill));
  cpSync(join(src, skill), join(dest, skill), { recursive: true });
  console.log(`${existed ? "↻ updated" : "✓ installed"} .claude/skills/${skill}`);
}
