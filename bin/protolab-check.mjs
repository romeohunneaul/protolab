#!/usr/bin/env node
// Validate the host's manifest against the contract: every rule, every error, then exit 1 if any.
// The manifest is evaluated with `@romeohunneaul/protolab` stubbed, so the engine (TSX) is never
// loaded; the proto loaders are functions and stay unexecuted. Needs Node 22.6+ (type stripping).
//
// Usage: protolab-check

import { existsSync, statSync } from "node:fs";
import { register } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { KEBAB, fail, readConfig } from "./_config.mjs";

const root = process.cwd();
const config = readConfig(root);
const manifestPath = join(root, config.manifest);
if (!existsSync(manifestPath)) fail(`manifest not found: ${config.manifest} (set "manifest" in protolab.config.json)`);

const stub = "data:text/javascript,export const defineProtos = (p) => p; export const findProto = (ps, s) => ps.find((p) => p.slug === s);";
register(
  "data:text/javascript," +
    encodeURIComponent(
      `export async function resolve(specifier, context, next) {
        if (specifier === "@romeohunneaul/protolab") return { url: ${JSON.stringify(stub)}, shortCircuit: true };
        return next(specifier, context);
      }
      // A host rarely sets "type": "module": name the format so Node does not warn while detecting it.
      export async function load(url, context, next) {
        return next(url, /\.(ts|mts)$/.test(url) ? { ...context, format: "module-typescript" } : context);
      }`,
    ),
);

let protos;
try {
  const mod = await import(pathToFileURL(manifestPath).href);
  protos = mod.PROTOS ?? Object.values(mod).find(Array.isArray);
  if (!Array.isArray(protos)) throw new Error("no exported array of protos (expected `export const PROTOS = defineProtos([...])`)");
} catch (e) {
  const reason =
    e.code === "ERR_UNKNOWN_FILE_EXTENSION" ? "TypeScript needs Node 22.6+ with type stripping (node --experimental-strip-types)" : e.message;
  fail(`could not load ${config.manifest}: ${reason}`);
}

const errors = [];
const err = (slug, msg) => errors.push(slug ? `${slug}: ${msg}` : msg);
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const seenSlugs = new Set();

for (const p of protos) {
  const slug = String(p.slug ?? "");
  // 1. slug unique and kebab-case
  if (seenSlugs.has(slug)) err(null, `duplicate slug "${slug}"`);
  seenSlugs.add(slug);
  if (!KEBAB.test(slug)) err(null, `slug "${slug}" is not kebab-case`);
  // 2. the proto folder exists
  if (!isDir(join(root, config.protosDir, slug))) err(slug, `${config.protosDir}/${slug}/ not found`);
  // 3. load is a function
  if (typeof p.load !== "function") err(slug, "load is missing");
  // 4. brief exists
  if (p.brief !== undefined && !existsSync(join(root, p.brief))) err(slug, `brief "${p.brief}" not found`);
  // 5 to 8. axes
  const axisKeys = new Set();
  for (const a of p.axes ?? []) {
    if (axisKeys.has(a.key)) err(slug, `duplicate axis key "${a.key}"`);
    axisKeys.add(a.key);
    if (!KEBAB.test(String(a.key))) err(slug, `axis key "${a.key}" is not kebab-case`);
    const values = a.values ?? [];
    if (values.length === 0) err(slug, `axis "${a.key}" has no values`);
    const ids = new Set();
    for (const v of values) {
      if (ids.has(v.id)) err(slug, `axis "${a.key}": duplicate value id "${v.id}"`);
      ids.add(v.id);
      if (!KEBAB.test(String(v.id))) err(slug, `axis "${a.key}": value id "${v.id}" is not kebab-case`);
    }
    if (a.default !== undefined && !ids.has(a.default)) err(slug, `axis "${a.key}": default "${a.default}" is not one of its values`);
    if (a.kind !== undefined && a.kind !== "state" && a.kind !== "structural") err(slug, `axis "${a.key}": kind "${a.kind}" is not "state" or "structural"`);
    for (const v of values) {
      if (a.kind === "structural" && typeof v.load !== "function") err(slug, `axis "${a.key}": structural axis, value "${v.id}" has no load`);
      if (a.kind !== "structural" && v.load !== undefined) err(slug, `axis "${a.key}": state axis, value "${v.id}" has a load`);
    }
  }
  // 9. screens
  const screenKeys = new Set();
  for (const s of p.screens ?? []) {
    if (screenKeys.has(s.key)) err(slug, `duplicate screen key "${s.key}"`);
    screenKeys.add(s.key);
    if (!KEBAB.test(String(s.key))) err(slug, `screen key "${s.key}" is not kebab-case`);
    (s.steps ?? []).forEach((label, i) => {
      if (typeof label !== "string" || label.trim() === "") err(slug, `screen "${s.key}": step ${i + 1} has an empty label`);
    });
  }
  // 10 and 11. scenarios
  const scenarioKeys = new Set();
  for (const s of p.scenarios ?? []) {
    if (scenarioKeys.has(s.key)) err(slug, `duplicate scenario key "${s.key}"`);
    scenarioKeys.add(s.key);
    if (!KEBAB.test(String(s.key))) err(slug, `scenario key "${s.key}" is not kebab-case`);
    const values = s.values ?? [];
    if (values.length === 0) err(slug, `scenario "${s.key}" has no values`);
    const ids = new Set();
    for (const v of values) {
      if (ids.has(v.id)) err(slug, `scenario "${s.key}": duplicate value id "${v.id}"`);
      ids.add(v.id);
      if (!KEBAB.test(String(v.id))) err(slug, `scenario "${s.key}": value id "${v.id}" is not kebab-case`);
    }
    if (s.default !== undefined && !ids.has(s.default)) err(slug, `scenario "${s.key}": default "${s.default}" is not one of its values`);
  }
  // 12. offDs needs a declared allow-list
  if (p.offDs === true && !(Array.isArray(config.ds?.offDs) && config.ds.offDs.length > 0)) {
    err(slug, "offDs is true but protolab.config.json declares no ds.offDs");
  }
}

for (const e of errors) console.error(`✗ ${e}`);
if (errors.length) {
  console.error(`✗ ${errors.length} error${errors.length > 1 ? "s" : ""} in ${config.manifest}`);
  process.exit(1);
}
console.log(`✓ ${config.manifest}: ${protos.length} proto${protos.length === 1 ? "" : "s"}, 0 errors`);
