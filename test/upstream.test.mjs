// scripts/upstream.mjs against a throwaway upstream repo: a newer commit is listed, then merged
// into a copy that keeps its own change.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "upstream.mjs");

test("upstream lists a newer commit, then merges it and keeps the copy's change", () => {
  const dir = mkdtempSync(join(tmpdir(), "protolab-upstream-test-"));
  try {
    const up = join(dir, "up");
    const work = join(dir, "work");
    const git = (...args) => execFileSync("git", ["-C", up, "-c", "user.name=t", "-c", "user.email=t@t", ...args], { encoding: "utf8" }).trim();
    mkdirSync(join(up, "skill"), { recursive: true });
    git("init", "-q");
    git("config", "uploadpack.allowAnySHA1InWant", "true");
    writeFileSync(join(up, "skill/a.md"), "one\ntwo\nthree\nfour\nfive\n");
    git("add", ".");
    git("commit", "-q", "-m", "first");
    const first = git("rev-parse", "HEAD");

    mkdirSync(join(work, "skills/x"), { recursive: true });
    writeFileSync(join(work, "skills/x/a.md"), "one (here)\ntwo\nthree\nfour\nfive\n");
    writeFileSync(join(work, "UPSTREAM.json"), JSON.stringify({
      sources: { up: { repo: `file://${up}`, commit: first } },
      copies: [{ source: "up", from: "skill", to: "skills/x" }],
    }));

    writeFileSync(join(up, "skill/a.md"), "one\ntwo\nthree\nfour\nfive (upstream)\n");
    writeFileSync(join(up, "skill/b.md"), "new\n");
    git("add", ".");
    git("commit", "-q", "-m", "second");
    const second = git("rev-parse", "HEAD");

    const run = (...args) => execFileSync(process.execPath, [script, ...args], { cwd: work, encoding: "utf8" });
    assert.match(run(), new RegExp(`↑ up: ${first.slice(0, 7)} → ${second.slice(0, 7)}`));
    assert.equal(readFileSync(join(work, "skills/x/a.md"), "utf8"), "one (here)\ntwo\nthree\nfour\nfive\n", "the check changes nothing");

    const out = run("--apply");
    assert.match(out, /↻ merged {3}skills\/x\/a\.md/);
    assert.match(out, /\+ added {4}skills\/x\/b\.md/);
    assert.equal(readFileSync(join(work, "skills/x/a.md"), "utf8"), "one (here)\ntwo\nthree\nfour\nfive (upstream)\n");
    assert.ok(existsSync(join(work, "skills/x/b.md")));
    assert.equal(JSON.parse(readFileSync(join(work, "UPSTREAM.json"), "utf8")).sources.up.commit, second);
    assert.match(run(), /= up: up to date/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
