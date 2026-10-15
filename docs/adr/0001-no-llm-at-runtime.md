# 0001. No LLM call at runtime

Date: 2026-10-15 · Status: accepted

## Context

Protolab turns a feature intent into a running screen with the help of an agent. Where the
intelligence runs decides what the package depends on, what a host must configure, and what a
shared link can leak.

## Decision

The package calls no language model and no external service at runtime. The intelligence runs
in Claude Code, through the skills shipped in `skills/` and the conversation. The manifest is
the contract between the skills, which write it, and the lab, which displays it. A request made
from the lab panel produces a prompt (copied, or opened in Claude Desktop); it never produces
code.

## Consequences

- No API key, no network call, no cost in a host; a host deploys the lab like any page.
- The panel navigates the space of declared variants and formulates requests; it generates
  nothing.
- Anything that needs a model (creating a proto, adding an axis, reviewing comments) is a skill.
