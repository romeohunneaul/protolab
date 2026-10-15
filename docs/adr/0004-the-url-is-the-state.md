# 0004. The URL is the state

Date: 2026-10-15 · Status: accepted

## Context

A reviewer must land on the exact view the author looked at: the same proto, screen, step, axis
values, scenario, viewport size, view and mode. The lab could keep part of that state in local
storage, cookies or on a server.

## Decision

Every piece of lab state is a search param of the proto page: `a.<key>` (axis), `screen`,
`step`, `s.<key>` (scenario), `v` (viewport size), `compare` (comparison view), `lab=0` (clean
page). Nothing is kept elsewhere. An absent or unknown value falls back to the declared default,
so a stale link never shows an unknown state. Changing a screen or a step pushes a history
entry; changing an axis, a scenario or a size replaces the current one. The engine never removes
a param it does not own.

## Consequences

- `Copy link` is the whole feature of sharing; reloading restores everything.
- The Back button restores the previous entry as it was, axis values included; the engine never
  rewrites history.
- Panel UI state (collapsed, open tab, request draft) is not lab state and is not in the URL.
