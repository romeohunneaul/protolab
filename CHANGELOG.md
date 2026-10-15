# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow SemVer. Hosts pin a
tag: `npm i -D github:romeohunneaul/protolab#v0.1.0`.

## [Unreleased]

## [0.1.0] - 2026-10-15

First tagged release: the engine as built since October 2026, plus the engineering baseline.

### Added

- Manifest: `defineProtos`, `findProto`, the `Proto` type with `axes` and `screens`.
- `ProtoView` with the lab panel on every proto page: back to the index, jump to another proto,
  the proto's screen and axes, `Copy link`; `LabDashboard` for the index.
- `useAxis` and `useScreen`: axis values and the current screen read from the URL; screens push
  a history entry so Back walks the flow.
- CLIs: `protolab-init` (wires a Next App Router host in one command, adds `update:protolab`),
  `protolab-new` (scaffolds a proto and registers it), `protolab-skills` (copies the skills).
- Skills shipped to hosts: `protolab-create`, `protolab-variant`, `protolab-ds-context`.
- `examples/next`: a host wired to the local engine.
- Engineering baseline: `CLAUDE.md`, ADRs 0001 to 0006 in `docs/adr/`, this changelog,
  `node:test` on `bin/`, typecheck and build of the example, a Playwright smoke test,
  the engineering skills in `.claude/skills/`, `rules/proto.md` shipped to hosts.
