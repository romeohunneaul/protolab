#!/usr/bin/env node
// The skills copied from other repos, listed in UPSTREAM.json: which sources have newer commits,
// and merging those commits into the copies. A copy keeps its local changes: each file is merged
// three ways (the pinned upstream, the newer upstream, the copy), and a conflict is left as
// markers in the file. A file mapped on its own (`to`) is not merged again by its folder.
//
// Usage: npm run upstream              # list the sources with newer commits
//        npm run upstream -- --apply   # merge them and move the pins in UPSTREAM.json

import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const root = process.cwd();
const lockPath = join(root, "UPSTREAM.json");
const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const apply = process.argv.includes("--apply");
const git = (args) => execFileSync("git", args, { stdio: ["ignore", "pipe", "pipe"] });
const github = (repo) => /^[\w.-]+\/[\w.-]+$/.test(repo);
const url = (repo) => (github(repo) ? `https://github.com/${repo}.git` : repo);
const owned = new Set(lock.copies.map((c) => c.to));
let conflicts = 0;

for (const [name, src] of Object.entries(lock.sources)) {
  const head = git(["ls-remote", url(src.repo), "HEAD"]).toString().split("\t")[0];
  if (head === src.commit) {
    console.log(`= ${name}: up to date (${src.commit.slice(0, 7)})`);
    continue;
  }
  const compare = github(src.repo) ? `  https://github.com/${src.repo}/compare/${src.commit}...${head}` : "";
  console.log(`↑ ${name}: ${src.commit.slice(0, 7)} → ${head.slice(0, 7)}${compare}`);
  if (!apply) continue;

  const tmp = mkdtempSync(join(tmpdir(), "protolab-upstream-"));
  try {
    git(["init", "-q", tmp]);
    for (const sha of [src.commit, head]) git(["-C", tmp, "fetch", "-q", "--depth", "1", url(src.repo), sha]);
    const tree = (sha, path) =>
      new Map(git(["-C", tmp, "ls-tree", "-r", sha, "--", path]).toString().split("\n").filter(Boolean)
        .map((line) => [line.split("\t")[1], line.split(" ")[0]]));
    const read = (sha, file) => git(["-C", tmp, "show", `${sha}:${file}`]);

    for (const c of lock.copies.filter((c) => c.source === name)) {
      const before = tree(src.commit, c.from);
      const after = tree(head, c.from);
      for (const file of new Set([...before.keys(), ...after.keys()])) {
        const rel = file === c.from ? "" : file.slice(c.from.length + 1);
        const to = rel ? join(c.to, rel) : c.to;
        if (rel && owned.has(to)) continue;
        const local = join(root, to);
        const base = before.has(file) ? read(src.commit, file) : undefined;
        const theirs = after.has(file) ? read(head, file) : undefined;
        if (base && theirs && base.equals(theirs)) continue;
        const mine = existsSync(local) ? readFileSync(local) : undefined;
        if (!mine) {
          if (!base && theirs) {
            mkdirSync(dirname(local), { recursive: true });
            writeFileSync(local, theirs);
            if (after.get(file) === "100755") chmodSync(local, 0o755);
            console.log(`  + added    ${to}`);
          } else if (base && theirs) console.log(`  ! changed upstream, removed here: ${to}`);
          continue;
        }
        if (!theirs) {
          if (base && mine.equals(base)) {
            unlinkSync(local);
            console.log(`  - removed  ${to}`);
          } else console.log(`  ! removed upstream, kept here (changed here): ${to}`);
          continue;
        }
        if (mine.equals(theirs)) continue;
        if (base && mine.equals(base)) {
          writeFileSync(local, theirs);
          console.log(`  ↻ updated  ${to}`);
          continue;
        }
        writeFileSync(join(tmp, "base"), base ?? "");
        writeFileSync(join(tmp, "theirs"), theirs);
        try {
          git(["merge-file", "-L", "copy", "-L", "pinned", "-L", "upstream", local, join(tmp, "base"), join(tmp, "theirs")]);
          console.log(`  ↻ merged   ${to}`);
        } catch (e) {
          if (!(e.status > 0 && e.status < 128)) throw e;
          conflicts += e.status;
          console.log(`  ✗ ${e.status} conflict(s) in ${to}`);
        }
      }
    }
    src.commit = head;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

if (apply) {
  writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
  console.log(conflicts ? `\n${conflicts} conflict(s): resolve the markers, then review the diff before committing.` : "\nMerged: review the diff, then commit.");
}
