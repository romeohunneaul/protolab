# 0003. Comments are Vercel Comments; the engine does not touch them

Date: 2026-10-15 · Status: accepted

## Context

Reviewers need to pin a remark on an element and a state of a proto. Options considered:
Vercel Comments (part of the Vercel Toolbar, free on every plan), Liveblocks, Velt, BugHerd,
Marker.io, a home-made layer.

## Decision

Comments are Vercel Comments. They are on by default on every preview deployment, visible to
people signed in to Vercel with access to the project; a shared link shows the page without the
comments. The engine ships no comment layer and does not depend on `@vercel/toolbar`. The README
says how a host wires the toolbar for `localhost`, and how to read comments from the terminal
(`vercel comments --json`).

## Consequences

- Every commenter needs a Vercel account and access to the project.
- Whether a comment pinned on `?a.state=empty` is distinguished from one pinned on
  `?a.state=rest` is to be verified on a real preview; if not, the state is noted in the comment.
- Reopened only if external people (clients) must comment.
