# 0007. A frame reports its URL to the lab page with postMessage

Date: 2026-10-15 · Status: accepted

## Context

The viewport frame and each comparison cell load the proto's clean page in a same-origin iframe
(ADR 0005). A gesture made inside a frame (the proto moves to a screen) changes the frame's own
URL. The URL of the lab page is the state (ADR 0004): `Copy link` must copy what is on screen, so
the lab page has to learn what happened in the frame. Options: read the frame's location from the
parent on an interval; let the frame tell the parent; render frames with no navigation inside.

## Decision

The clean page, when it runs inside a frame (`window.parent !== window`), posts a message
`{ type: "protolab:params", search }` to its parent on every change of its search params, with the
page origin as target. The lab page listens to messages from its own origin, computes what differs
from its own params (ignoring `lab`, `v`, `compare`, and the compared axis in a comparison cell),
and writes the difference in its URL: a screen or a step pushes a history entry, anything else
replaces it, like a change made from the panel. When the lab URL changes, each frame compares its
current location with the link it should show and navigates with `location.replace` only when
they differ, so a gesture reported from a frame does not reload that frame.

## Consequences

- A frame has no state of its own; reloading the lab page renders it at the same state.
- No polling, no shared storage; messages are same-origin only, and the payload is a query string.
- A host that renders the lab under another origin than its pages would break the report; the
  lab pages and the protos live in the same Next app, so this does not happen.
