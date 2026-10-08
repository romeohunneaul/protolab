import { Suspense, type ComponentType, type ReactNode } from "react";
import type { Proto } from "./manifest";
import { VariantProvider, VariantSwitcher } from "./variants";

/**
 * Renders one proto inside its axes, with the switcher. The host page resolves `Component`
 * (with `next/dynamic` at module scope) and may pass a dev-only `annotation` toolbar
 * (e.g. agentation) that the package deliberately does not depend on.
 */
export function ProtoView({
  proto,
  Component,
  annotation,
}: {
  proto: Proto;
  Component: ComponentType;
  annotation?: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <VariantProvider axes={proto.axes ?? []}>
        <Component />
        <VariantSwitcher />
      </VariantProvider>
      {annotation}
    </Suspense>
  );
}
