# 0008. Design skills: impeccable beside the package, two motion skills inside it

Date: 2026-10-24 · Status: accepted

## Context

The protolab skills build a proto and its variations; none of them critiques, audits or polishes
a screen, and none builds a motion. Two public sets cover that: `pbakaus/impeccable`, one skill
with 24 commands (critique, audit, polish, distill, layout, typeset, clarify, harden, adapt…),
shipped as a Claude Code plugin with four subagents and detector hooks; and
`emilkowalski/skills`, fifteen skills, eight of them on motion. Installing both whole would give
two skills for the same request (variants, motion, worst-case data, picking a library), and some
of their commands write a second source of truth next to the proto's (`PRODUCT.md`, `DESIGN.md`)
or variants outside the manifest (`impeccable live`, `generate`).

## Decision

- **impeccable stays outside the package.** The user installs it, as the plugin
  (`impeccable@impeccable`, skill, subagents and hooks) or as a copy in the project
  (`npx impeccable install --providers=claude --scope=project`). `protolab-skills` reports which
  one it finds, both, or neither with the two install commands; it never installs it and never
  fails on it.
- **Two motion skills are vendored** from `emilkowalski/skills` (MIT, commit `2d22863`), unchanged,
  with their licence: `animate` and `review-animations`. `protolab-skills` copies them with the
  others.
- **`break-ui` is not shipped**: its catalog of worst-case values goes into `protolab-scenarios`
  (`worst-case.md`, with its licence), as a `worst-case` value of a scenario.
- **`rules/proto.md` routes each design request to one skill** and keeps the proto's rules for
  their edits: the host's components and tokens, custom CSS asked first, a motion library only
  from `ds.offDs`.
- Not shipped: emil's `prototype` (the lab's divergence), `pick-ui-library` (the design system
  and `ds.offDs` decide), the other motion skills (covered by the two kept), and the Swift, Expo
  and Sonner skills (outside a Next host).

## Consequences

- impeccable updates itself through its plugin or its installer; the package carries no copy of
  it and no download of its engine.
- The two vendored skills change only when this repo copies a newer commit.
- A host without impeccable keeps every protolab skill; it loses the design pass.
- impeccable's commands that the rule redirects still exist: the rule, loaded when a proto file
  is read or edited, is what keeps them off a proto.
