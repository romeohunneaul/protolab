"use client";

import { useAxis } from "@romeohunneaul/protolab";

export default function Hello() {
  const state = useAxis("state");
  return (
    <section className="py-8">
      <h1 className="mb-1 text-2xl font-semibold">Hello</h1>
      {state === "loading" && <p className="animate-pulse text-sm text-neutral-500">Loading…</p>}
      {state === "empty" && <p className="text-sm text-neutral-500">Nothing here yet.</p>}
      {state === "rest" && <p className="text-sm text-neutral-700">Switch the state from the panel. The URL carries it: share the link, get the same screen.</p>}
    </section>
  );
}
