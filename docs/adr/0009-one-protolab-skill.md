# 0009. One protolab skill, with commands

Date: 2026-10-24 · Status: accepted

## Context

The package shipped six skills (`protolab-create`, `-variant`, `-diverge`, `-scenarios`,
`-ds-context`, `-review`) next to `impeccable`, one skill with commands. Six descriptions compete
for the same requests (a variant, approaches, a scenario), each repeats the same reading step, and
nothing in the host says how to update the package once the script's name is forgotten.

## Decision

- **One skill, `protolab`**, built like `impeccable`: `SKILL.md` holds the description, the shared
  reading step and the routing; each command is a reference file (`reference/<command>.md`),
  loaded when the command runs. `protolab-ds-context` becomes `/protolab ds`.
- **An `update` command**: from "update protolab", it runs `npm run update:protolab`, reads the
  changelog shipped in the package since the pinned commit, proposes the migrations and the
  commit. The package ships `CHANGELOG.md` for it.
- `protolab-skills` removes the six old folders from a host's `.claude/skills/`.

## Consequences

- Two entries in a host's skill list, `protolab` and `impeccable`, and one description each to
  route a request.
- A prompt or a document that names an old skill says `/protolab <command>` instead.
