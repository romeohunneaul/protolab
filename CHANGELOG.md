# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow SemVer. Hosts pin a
tag: `npm i -D github:romeohunneaul/protolab#v0.1.0`.

## [Unreleased]

### Added

- Manifest v2 (ADR 0001 of the product repo): `kind: "structural"` axes whose values are
  components rendered by `<AxisSlot axis="…" />`; `steps` on a screen, read and moved with
  `useScreen().step/steps/next/prev` and `go(key, step?)`; `scenarios` with one `data` loader
  per value, read with `useScenario(key)`; `brief` and `offDs` on a proto. New exported types
  `AxisValue`, `Scenario`, `ScenarioValue`, `Loader`.
- The panel shows the `Step` selector and the scenarios; the index shows `Screens ×n` (two
  screens or more), the scenarios and the `Off design system` mark, and an empty state.
- `examples/next`: `flow` extended with a checkout in three steps, a structural `layout` axis
  for the list and a `volume` scenario.
- `protolab-check`: validates the manifest against the contract (twelve rules, every error
  listed in manifest order, exit 1), with `@romeohunneaul/protolab` stubbed so the engine is
  never loaded. Needs Node 22.6+ (type stripping).
- `protolab-init`: the design-system step (detects `.storybook/` and `components.json`, asks
  where the design system is documented and which libraries are allowed outside it, writes the
  `ds` block, patches an existing config without it); writes the new proto page shape (server
  page plus `proto.tsx`); signals a v1 page instead of writing next to it; refuses to run
  without `package.json` or an `app/` folder; the `Next:` block names `protolab-check` and the
  same-origin iframe requirement. All three CLIs refuse a `protolab.config.json` that is not JSON.

- The lab panel is a drawer on the right with three tabs: `Variants`, `Viewport` (presets
  `Phone`, `Tablet`, `Laptop`, `Desktop`, `Free size`, `Custom`; the clean page renders in an
  iframe of that exact size, `?v=<w>x<h>`) and `Compare` (one iframe cell per value of an axis,
  `?compare=<key>`, `current` mark, `Open`, `Exit comparison`); `Copy clean link`; the current
  state in the footer; `Copied` feedback and a text field when the clipboard is unavailable.
- The clean page (`?lab=0`): the screen alone, no tool, the link's size applied.
- A gesture inside a frame is reported to the lab URL (ADR 0007: same-origin postMessage).
- The `Request` tab: `Add an axis or a value`, `Change this component` (designate an element by
  clicking it, in the page or inside the viewport frame; Escape cancels; a state change clears
  the designation), `Add a scenario`. The lab composes a prompt (the proto, the link and the
  state in clear, the target, the options, the intent, the instructions for a session) and
  offers `Copy prompt` and `Open in Claude Desktop` (`claude://code/new?q=…`, no folder); it
  writes no code. A draft is not in the URL.

### Changed

- **Migration.** `ProtoView` is a client component and no longer takes a `Component` prop: the
  proto page is a server page that checks the slug and renders a client module next to it
  (`proto.tsx`) that imports the manifest and renders `<ProtoView proto protos basePath />`.
  Delete your `<basePath>/p/[slug]/page.tsx` and run `npx protolab-init` again, or apply the
  page of the README. A manifest written for 0.1 stays valid as is.
- An axis, a scenario or a size switch replaces the history entry; a screen or a step pushes one
  and scrolls to the top. The Back button restores the previous entry as it was.
- `LabPanel`, when used directly, takes `open` and `onOpenChange` props.

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
