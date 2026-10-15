# 0002. Divergence happens in the lab, not on a design canvas

Date: 2026-10-15 · Status: accepted

## Context

Comparing several approaches of a screen (divergence) can happen on a design canvas, outside the
code, or inside the lab, with the host's real components. A canvas tied to one vendor was
considered.

## Decision

Divergence and convergence both happen in Protolab. Several approaches of a screen are values
of a structural axis (one component per value), and the lab offers a comparison view that
renders each value side by side. Everything lives in the host repo, rendered by Next, deployed
on Vercel. No design-canvas integration.

## Consequences

- The manifest gains structural axes and the lab a comparison view (manifest v2).
- An approach is code in the host from day one: it uses the real components, and it is kept or
  deleted like any proto.
- A canvas remains usable by hand upstream; the engine ignores it.
