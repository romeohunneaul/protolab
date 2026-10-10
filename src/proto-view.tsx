import { Suspense, type ComponentType, type ReactNode } from "react";
import type { Proto } from "./manifest";
import { LabPanel } from "./panel";
import { VariantProvider } from "./variants";

/**
 * Renders one proto inside its axes and screens, with the lab panel. The host page resolves
 * `Component` (with `next/dynamic` at module scope), passes the manifest as `protos` so the panel
 * can jump between protos, and may pass a dev-only `annotation` toolbar (e.g. agentation) that the
 * package deliberately does not depend on.
 */
export function ProtoView({
  proto,
  Component,
  protos = [],
  basePath = "/lab",
  annotation,
}: {
  proto: Proto;
  Component: ComponentType;
  protos?: Proto[];
  basePath?: string;
  annotation?: ReactNode;
}) {
  // Only plain data crosses into the client panel: `load` is a function.
  const ref = ({ slug, name }: Proto) => ({ slug, name });
  return (
    <Suspense fallback={null}>
      <VariantProvider axes={proto.axes ?? []} screens={proto.screens ?? []}>
        <Component />
        <LabPanel proto={ref(proto)} protos={protos.map(ref)} basePath={basePath} />
      </VariantProvider>
      {annotation}
    </Suspense>
  );
}
