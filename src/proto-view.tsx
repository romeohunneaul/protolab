"use client";

import { Suspense, type ReactNode } from "react";
import type { Proto } from "./manifest";
import { LabPanel } from "./panel";
import { VariantProvider, componentOf } from "./variants";

/**
 * Renders one proto inside its axes, screens and scenarios, with the lab panel. A client
 * component: the host page renders it from a client module that imports the manifest, so the
 * loaders (the proto, the structural values, the scenario data) never cross the server boundary.
 * Pass the manifest as `protos` so the panel can jump between protos, `basePath` if not `/lab`,
 * and an optional dev-only `annotation` toolbar the package deliberately does not depend on.
 */
export function ProtoView({
  proto,
  protos = [],
  basePath = "/lab",
  annotation,
}: {
  proto: Proto;
  protos?: Proto[];
  basePath?: string;
  annotation?: ReactNode;
}) {
  const Component = componentOf(proto.load);
  const ref = ({ slug, name, offDs }: Proto) => ({ slug, name, offDs });
  return (
    <Suspense fallback={null}>
      <VariantProvider axes={proto.axes} screens={proto.screens} scenarios={proto.scenarios}>
        <Component />
        <LabPanel proto={ref(proto)} protos={protos.map(ref)} basePath={basePath} />
      </VariantProvider>
      {annotation}
    </Suspense>
  );
}
