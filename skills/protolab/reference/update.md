# Update protolab

The host follows the `main` branch of the package. An update moves the commit pinned in
`package-lock.json`, recopies the skills, the subagents and the proto rule into `.claude/`, checks
the manifest, and applies the migrations the changelog asks for. Nothing is committed without the
user.

## 1. Before

1. `git status`: if `package.json`, `package-lock.json` or `.claude/` have uncommitted changes, say
   so and ask: the rollback below would lose them.
2. Note the pinned commit: the part after `#` in
   `node -p "require('./package-lock.json').packages['node_modules/@romeohunneaul/protolab'].resolved"`.
3. Keep the current changelog to compare: copy `node_modules/@romeohunneaul/protolab/CHANGELOG.md`
   to a temporary file, if it exists (an install older than this command ships none).

## 2. Update

Run `npm run update:protolab`. If `package.json` has no such script, run what it would run and
offer to add it:

```bash
npm i -D @romeohunneaul/protolab@github:romeohunneaul/protolab && npx protolab-skills && npx protolab-check
```

Read the output: a `✗ removed` line is a skill the package no longer ships; a `!` line is for the
user (an impeccable plugin to disable); a `protolab-check` error is a migration to make (step 4).

## 3. What changed

Read the new pinned commit the same way. Same commit as before: say the host is up to date, and
stop.

Otherwise, compare the `Unreleased` section (and any version section added since) of the new
`node_modules/@romeohunneaul/protolab/CHANGELOG.md` with the copy kept in step 1; without a copy,
take the whole `Unreleased` section. Tell the user, in a few lines, what changed for them: the new
commands, the changed behaviours, what was removed. Give the compare link
`https://github.com/romeohunneaul/protolab/compare/<old>...<new>`.

## 4. Migrations

Each new entry that asks the host to change something ("Existing hosts: …", a migration step, a
`protolab-check` error) is one line of a list: what to change, in which file, and why. Present the
list, apply the accepted lines one by one, then `npx protolab-check` and the project's typecheck.

## 5. After

1. Propose the commit: `package.json`, `package-lock.json`, `.claude/skills/`, `.claude/agents/`,
   `.claude/rules/proto.md`, and the files the migrations changed. Every clone then runs the same
   engine.
2. If the session still shows the commands of before the update, a new session loads the new
   ones.
3. If something is broken and the user wants the previous engine back:

```bash
git checkout package.json package-lock.json .claude && npm ci
```

## What this command does not do

- It does not edit `node_modules`, and does not change a proto beyond an accepted migration.
- It does not follow `impeccable` upstream: that happens in the protolab repo
  (`npm run upstream`), and reaches the host through this update.
