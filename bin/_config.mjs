// Shared by the CLIs: protolab.config.json at the host root, with the defaults of the engine.
// The engine itself never reads this file; `basePath` reaches it through the page props.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const DEFAULTS = {
  protosDir: "src/lab/protos",
  manifest: "src/lab/manifest.ts",
  componentsDir: "src/components/ui",
  basePath: "/lab",
};

export const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

/** The config, defaults applied, or exit 1 when the file exists but is not valid JSON. */
export function readConfig(root) {
  const path = join(root, "protolab.config.json");
  if (!existsSync(path)) return { ...DEFAULTS, _exists: false };
  try {
    return { ...DEFAULTS, ...JSON.parse(readFileSync(path, "utf8")), _exists: true };
  } catch (e) {
    return fail(`could not read protolab.config.json: ${e.message}`);
  }
}

export const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
