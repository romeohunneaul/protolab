---
name: protolab
description: Use when the user works on a prototype of the host's lab (protolab.config.json, a manifest, protos under protosDir) - creates a proto with the project's real components ("nouveau proto", "prototype la feature X", "new proto"), adds a variant, a state or a structural axis ("ajoute un état", "fais une variante", "deux versions de ce bloc", "teste X vs Y"), produces competing approaches and converges ("propose-moi N approches", "diverge sur ce hero", "à quoi devrait ressembler cet écran", "give me 3 options", "what should this look like", "on garde la B"), adds data scenarios and worst cases ("avec 500 lignes", "vu par un admin", "le pire cas", "casse l'UI"), gathers the design system a proto may use ("quels composants j'ai", "récupère le storybook"), turns Vercel Comments into changes ("traite les retours", "review the comments"), and updates the package ("mets à jour protolab", "update protolab"). Not for the visual quality of a screen (critique, audit, polish, layout, type, colour, motion): that is impeccable.
user-invocable: true
argument-hint: "[create · variant · diverge · scenarios · ds · review · update] [target]"
---

The lab of a Next.js host: a proto is a React component of the host, built with its components,
registered in one manifest, served at `<basePath>/p/<slug>`, with its state in the URL.

> Every rule is paid by the agent, not by the user. Never block on a gap you can fix alone.
> On a product arbitrage, `AskUserQuestion` with proposed defaults.

## Before any write

1. Read `.claude/rules/proto.md`: what a proto is and respects.
2. Read `protolab.config.json`: `protosDir`, `manifest`, `componentsDir`, `basePath`, `ds`, `app`.
3. On an existing proto, read its manifest entry, its folder `<protosDir>/<slug>/` (its
   `context.md` first, when `create` wrote one), and its brief when the entry declares one
   (`brief`).
4. Before picking a component you have not read in this session, run `ds`.

`ds`, `review` and `update` write no proto: they skip steps 3 and 4.

## Commands

| Command | Description | Reference |
|---|---|---|
| `create [intent]` | A new proto from a clarified brief, mapped to the design system and shaped like the real app | [reference/create.md](reference/create.md) |
| `variant [slug]` | A state axis, a structural axis, screens or steps on a proto | [reference/variant.md](reference/variant.md) |
| `diverge [slug]` | N competing approaches of a block or a screen, then converge on one | [reference/diverge.md](reference/diverge.md) |
| `scenarios [slug]` | Data sets: volumes, roles, personas, the worst case | [reference/scenarios.md](reference/scenarios.md) · [reference/worst-case.md](reference/worst-case.md) |
| `ds` | The components, documentation and libraries a proto may use | [reference/ds.md](reference/ds.md) |
| `review` | Vercel Comments on the previews, turned into changes | [reference/review.md](reference/review.md) |
| `update` | Update the package, its skills and its rules, with the migrations | [reference/update.md](reference/update.md) |

Routing:

- **Explicit or clearly implied command:** load its reference and follow it. Ask once if two fit.
- **No argument:** list the protos of the manifest and the commands above, and ask what to do;
  never run a command unasked.
- **A variation:** a mode of the screen or one more version the user described is `variant`; several
  directions to compare is `diverge`; the data the screen renders with is `scenarios`.
- **A design request on a proto** (critique, polish, layout, type, colour, wording, motion): `impeccable`,
  through `.claude/rules/proto.md`.
- **Framing a feature before any proto:** the product brief, not a command here.
