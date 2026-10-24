# 0008. Design skills: an adjusted copy of impeccable, pinned to its upstream

Date: 2026-10-24 · Status: accepted

## Context

The protolab skills build a proto and its variations; none critiques, audits or polishes a
screen, and none builds a motion. Two public sets cover that: `pbakaus/impeccable`, one skill with
24 commands (critique, audit, polish, layout, typeset, clarify, harden, animate…), shipped as a
Claude Code plugin with subagents and detector hooks; and `emilkowalski/skills`, fifteen skills,
eight of them on motion. Installed as they are, they overlap with protolab and with each other:
variants (`impeccable live`, `generate`, emil's `prototype`), framing (`impeccable shape`), motion
(two `animate`), worst-case data (`break-ui`). A plugin cannot be adjusted, and a second source of
skills is one more thing to install and to keep up to date in every host.

## Decision

- **One set, shipped by `protolab-skills`.** The package carries an adjusted copy of impeccable
  (`skills/impeccable`) next to the protolab skills, and impeccable's subagents (`agents/`), copied
  into the host's `.claude/agents/`. A skill folder is replaced whole on each run.
- **The copy is adjusted, and the adjustments are listed** in `skills/impeccable/CHANGES.md`
  (Apache-2.0 asks for it): `live`, `generate`, `shape` and `craft` are removed (a variant is a
  manifest entry, a feature is framed in its brief); `animate` builds with Emil's `animate`;
  `review-motion` is Emil's `review-animations`; the description and the routing leave a proto's
  variants, approaches and data to protolab.
- **`break-ui` becomes data**: its catalog goes into `protolab-scenarios` (`worst-case.md`).
- **Every copied file is pinned** in `UPSTREAM.json` (repo, path, commit). `npm run upstream` lists
  the sources with newer commits; `npm run upstream -- --apply` merges them three ways per file
  (pinned upstream, newer upstream, copy), so the adjustments stay and a conflict is left as
  markers, then moves the pins. The result goes to `main` in a PR, like any change.
- **The engine of impeccable is not adjusted**: its launcher downloads the binary at the version
  in `scripts/VERSION`. The skill still reads `PRODUCT.md` and `DESIGN.md`; `init` now starts from
  the brief.
- `protolab-skills` warns when the impeccable plugin is enabled too.
- `rules/proto.md` routes each design request to one skill and keeps the proto's rules for their
  edits: the host's components and tokens, custom CSS asked first, a motion library only from
  `ds.offDs`.
- Not shipped: emil's `prototype` (the lab's divergence), `pick-ui-library` (the design system and
  `ds.offDs` decide), its other motion skills (covered by the two kept), its Swift, Expo and Sonner
  skills (outside a Next host).

## Consequences

- A host gets the design pass with `npm run update:protolab`, like the rest; nothing else to
  install.
- An upstream release reaches the hosts in two steps: `npm run upstream -- --apply` and a PR here,
  then `update:protolab` in each host.
- A change made to a skill inside a host is lost at the next update: skills change here.
- The package grows by about 2 MB (impeccable's scripts and font index).
