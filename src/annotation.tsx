"use client";

import { lazy, Suspense } from "react";

// Dev-only: the annotation toolbar never ships to production. Agentation (optional peer) turns a
// click on any element into a markdown block (selector + component + styles) to paste into an agent.
const Agentation = lazy(() =>
  import("agentation")
    .then((m) => ({ default: m.Agentation }))
    .catch(() => ({ default: () => null })),
);

export function LabAnnotation() {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <Suspense fallback={null}>
      <Agentation />
    </Suspense>
  );
}
