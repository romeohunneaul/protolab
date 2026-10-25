# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Hosts follow `main`
(`npm run update:protolab`); a change that asks a host to adapt its code says how, under
`Unreleased`. Tags `v0.1.0` to `v0.3.0` stay as history.

## [Unreleased]

### Added

- The design pass (ADR 0008): `impeccable`, an adjusted copy of pbakaus/impeccable with Emil
  Kowalski's motion skills (`/impeccable animate`, `/impeccable review-motion`), ships with the
  protolab skills; its subagents go into `.claude/agents/`. `protolab-skills` warns when the
  impeccable plugin is enabled too. `rules/proto.md` routes each design request to one skill.
- `protolab-scenarios`: a `worst-case` value, built from a catalog of values that break UI
  (`worst-case.md`, from `break-ui`).
- `UPSTREAM.json` and `npm run upstream`: the copied files, their pinned commits, and a three-way
  merge of newer upstream commits that keeps the local changes.
- `/protolab update` (ADR 0009): asked "update protolab", Claude Code runs `update:protolab`, says
  what changed since the pinned commit from the changelog, proposes the migrations and the commit.
  The package ships `CHANGELOG.md` for it.

### Fixed

- Viewport and comparison frames keep their exact size: a frame wider than the render zone was
  shrunk while the footer still named the preset; now the zone scrolls and the left edge stays in
  reach. The clean page at a size does the same.
- A frame no longer reloads after a gesture inside it: the lab compared links with their params in
  order.
- Panel accessibility: a field's label names its select alone (clicking `Density` no longer opens
  Explore through the `+ Add` it wrapped); a visible focus ring on the dark panel; tabs with
  `tabpanel`s, arrow keys, `Home` and `End`; `Copied` and Explore notices announced to screen
  readers; small text at 11px and readable contrast; targets at least 24px high.
- The panel sets its own font and dark form controls instead of inheriting the host's.
- Collapsing the panel keeps the Explore draft.
- The comparison zone sets its text color, readable on a host with a dark theme.
- Two param writes in a row no longer lose the first: writes build on the URL at call time.

Existing hosts: `npm run update:protolab`. If impeccable was installed as a plugin, disable it; a
copy from `npx impeccable install` in `.claude/skills/impeccable` is replaced.

### Changed

- `/protolab create` (ADR 0010): the brief is clarified first (the screen, its user, its data, its
  states), then the context is gathered precisely: each element of the screen mapped to a
  component or an existing composition (`/protolab ds`), and the real app read on the scope of the
  screen (its page, its types, its fixtures) so the data mirrors the app's shape, without its
  plumbing (no fetch, no auth, no error handling). It writes `context.md` in the proto's folder;
  the other commands start from it. New optional config key `app`: the path to the real app when
  the protos live in a repo of their own.
- `/protolab diverge` takes what fits the lab from `prototype` in mattpocock/skills (MIT): one
  question before the approaches, the approaches judged inside their real page, a self-check that
  two approaches do not share layout and primary action, a mixed verdict built as a new value,
  the divergence committed before converging, the verdict written down.
- The six protolab skills become one, `protolab`, with commands like `impeccable` (ADR 0009):
  `/protolab create`, `variant`, `diverge`, `scenarios`, `ds` (was `protolab-ds-context`),
  `review`, `update`. `protolab-skills` removes the old `.claude/skills/protolab-*` folders.
- `protolab-skills` replaces each skill folder whole, so a file removed from the package goes
  away in the host.
- Hosts follow `main`: no release tags to pin. `update:protolab`, written by `protolab-init`,
  also runs `protolab-check`. Existing hosts can add `&& protolab-check` to their script.

Existing hosts: `npm run update:protolab`, then commit the removed `.claude/skills/protolab-*`
folders with the new `.claude/skills/protolab`. A prompt or a doc of the host that names an old
skill says `/protolab <command>` instead.

## [0.3.0] - 2026-10-21

### Changed

- The `Request` tab becomes `Explore`: one field, "what do you want to try?", with clickable
  examples and an optional element to point at, instead of three forms that asked the user to
  classify the request (axis, value, scenario). The prompt asks Claude Code to decide what it is
  with the skills, and to give the comparison links.
- `Variants`: a `+` next to each axis and scenario opens `Explore` prefilled ("Add an option to
  \"Density\": "), and `+ Explore a variant` below the selectors. The tabs stay mounted, so a
  draft survives a tab switch.
- README: adding a variant is a sentence to Claude Code; the vocabulary is for editing by hand.

## [0.2.0] - 2026-10-21

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
- Skills v2: `protolab-variant` (state or structural axis, screens and steps), `protolab-diverge`
  (N approaches as one structural axis, then converge), `protolab-scenarios` (deterministic data
  sets), `protolab-ds-context` (reads the `ds` block: Storybook, Claude Design, allowed
  libraries), `protolab-create` (brief, jobs, Mobbin references, hands over to the others),
  `protolab-review` (Vercel Comments to changes). Skills and `rules/proto.md` are now in English.
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
