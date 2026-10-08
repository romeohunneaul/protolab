import { Suspense, type ComponentType } from "react";
import type { Proto } from "./manifest";
import { VariantProvider, VariantSwitcher } from "./variants";
import { LabAnnotation } from "./annotation";

/**
 * Renders one proto inside its axes, with the switcher and the dev-only annotation toolbar.
 * The host page resolves `Component` (with `next/dynamic` at module scope) and passes it in.
 */
export function ProtoView({ proto, Component }: { proto: Proto; Component: ComponentType }) {
  return (
    <Suspense fallback={null}>
      <VariantProvider axes={proto.axes ?? []}>
        <Component />
        <VariantSwitcher />
      </VariantProvider>
      <LabAnnotation />
    </Suspense>
  );
}
