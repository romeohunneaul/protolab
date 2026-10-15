# 0005. The viewport renders the proto in a same-origin iframe

Date: 2026-10-15 · Status: accepted

## Context

Checking a screen at the sizes that matter (390, 768, 1280 px…) without leaving the lab needs a
fixed-size rendering surface. Options: CSS-constrain the proto inside the lab page, or render
the proto page itself in an iframe at the requested size.

## Decision

The viewport and each cell of the comparison view are same-origin iframes that load the proto's
clean page (`lab=0`) at the current link, without `v` and `compare`. The frame imposes a size
and nothing else: no device emulation. Gestures made inside the frame (moving to a screen) are
reported to the lab page URL, so the frame has no state of its own and never nests another frame.

## Consequences

- The host must allow its own pages in a same-origin frame (no `frame-ancestors 'none'` or
  `X-Frame-Options: DENY` on the lab routes); `protolab-init` reminds it.
- Media queries and layout behave exactly as at that window width, which a CSS container would
  not guarantee.
- A rendering error inside a frame shows the host's error page in that frame only.
