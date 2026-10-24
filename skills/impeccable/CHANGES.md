# Changes from upstream

This folder is a copy of `plugin/skills/impeccable` from
[pbakaus/impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0, see `LICENSE` and
`NOTICE.md`), at the commit pinned in protolab's `UPSTREAM.json`, modified for protolab as listed
below. `npm run upstream` in the protolab repo merges newer upstream commits into it and keeps these
changes.

## Removed

- The `live`, `generate`, `shape` and `craft` commands: `reference/live.md`, `live-setup.md`,
  `generate.md`, `shape.md`, `craft.md`, their rows in `SKILL.md`, and their mentions in
  `routing.md`, `init.md`, `new-work.md`, `critique.md`, `audit.md`, `audit.native.md`. In a lab, a
  variant is a manifest entry (protolab), and a feature is framed in its brief.
- The "Live-mode signature params" sections of `colorize.md`, `layout.md`, `typeset.md`.
- The `impeccable-manual-edit-applier` subagent, used by live mode only.

## Changed

- `SKILL.md`: the description names motion and leaves a lab proto's variants, approaches and data
  scenarios to protolab; the routing sends them to protolab and a design edit on a proto through
  `.claude/rules/proto.md`; the `review-motion` command is added.
- `reference/animate.md`: "Timing and easing" and "Implement to the runtime" give way to "Build it",
  which follows `animate-build.md`.
- `reference/init.md`: a brief the user points to, or a proto's `brief`, is read first and its
  answers proposed back.

## Added

- `reference/animate-build.md`, `reference/animate-recipes.md`: `animate` from
  [emilkowalski/skills](https://github.com/emilkowalski/skills) (MIT), without its frontmatter and
  its "Initial Response", with its links to skills that are not shipped replaced.
- `reference/review-motion.md`, `reference/motion-standards.md`: `review-animations` from the same
  repo, adapted the same way.
- `NOTICE.md`: the section on Emil Kowalski's skills.
- This file.

The engine (`scripts/impeccable`, the binary it downloads at the version in `scripts/VERSION`) is
unchanged.
