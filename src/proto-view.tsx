"use client";

import { Suspense, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { Proto } from "./manifest";
import { CompareGrid, ViewportFrame, useReportToParent } from "./frames";
import { LabPanel } from "./panel";
import { VariantProvider, compareValue, componentOf, isCleanPage, viewportValue } from "./variants";

/**
 * Renders one proto inside its axes, screens and scenarios, with the lab panel. A client
 * component: the host page renders it from a client module that imports the manifest, so the
 * loaders (the proto, the structural values, the scenario data) never cross the server boundary.
 *
 * The URL decides the mode: `lab=0` is the clean page (no tool, the link's size applied);
 * otherwise `compare=<axis>` shows the comparison grid, `v=<w>x<h>` the viewport frame, and
 * nothing the proto in the page. Pass the manifest as `protos` so the panel can jump between
 * protos, `basePath` if not `/lab`, and an optional dev-only `annotation` toolbar.
 */
export function ProtoView(props: { proto: Proto; protos?: Proto[]; basePath?: string; annotation?: ReactNode }) {
  // useSearchParams() needs a Suspense boundary above it for the page to prerender.
  return (
    <Suspense fallback={null}>
      <View {...props} />
    </Suspense>
  );
}

function View({ proto, protos = [], basePath = "/lab", annotation }: { proto: Proto; protos?: Proto[]; basePath?: string; annotation?: ReactNode }) {
  const params = useSearchParams();
  const clean = isCleanPage(params);
  const size = viewportValue(params);
  const compared = clean ? undefined : compareValue(proto.axes ?? [], params);
  const [open, setOpen] = useState(true);
  const Component = componentOf(proto.load);
  const ref = ({ slug, name, offDs }: Proto) => ({ slug, name, offDs });

  return (
    <>
      <VariantProvider axes={proto.axes} screens={proto.screens} scenarios={proto.scenarios}>
        {clean ? (
          <CleanPage size={size}>
            <Component />
          </CleanPage>
        ) : (
          <>
            <div className={open && (compared || size) ? "sm:pr-80" : undefined} data-lab-zone>
              {compared ? <CompareGrid axis={compared} size={size} /> : size ? <ViewportFrame width={size.width} height={size.height} /> : <Component />}
            </div>
            <LabPanel proto={ref(proto)} protos={protos.map(ref)} basePath={basePath} open={open} onOpenChange={setOpen} />
          </>
        )}
      </VariantProvider>
      {clean ? null : annotation}
    </>
  );
}

/** The clean page: the screen alone, at the link's size when it has one, centered, no border, no label. */
function CleanPage({ size, children }: { size: { width: number; height: number } | null; children: ReactNode }) {
  useReportToParent();
  if (!size) return <>{children}</>;
  return (
    <div className="flex justify-center">
      <div style={{ width: size.width, height: size.height }} className="overflow-auto">
        {children}
      </div>
    </div>
  );
}
