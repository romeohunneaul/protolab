"use client";

import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { Proto } from "./manifest";
import { CompareGrid, ViewportFrame, useReportToParent } from "./frames";
import { DESIGNATE, DESIGNATED, DESIGNATING, DESIGNATION_CANCELLED, sameOrigin, useDesignation, type Designated } from "./designate";
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
 * protos, `basePath` if not `/lab`, and an optional dev-only `annotation` toolbar. `explore` shows
 * the Explore tab; by default only under `next dev`, where the author has the repo and Claude Code.
 */
export function ProtoView(props: { proto: Proto; protos?: Proto[]; basePath?: string; annotation?: ReactNode; explore?: boolean }) {
  // useSearchParams() needs a Suspense boundary above it for the page to prerender.
  return (
    <Suspense fallback={null}>
      <View {...props} />
    </Suspense>
  );
}

function View({
  proto,
  protos = [],
  basePath = "/lab",
  annotation,
  explore = process.env.NODE_ENV === "development",
}: {
  proto: Proto;
  protos?: Proto[];
  basePath?: string;
  annotation?: ReactNode;
  explore?: boolean;
}) {
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
            {/* With a frame or a grid, the render zone covers the window left of the panel: it escapes the
                host's layout (each frame already renders it) and scrolls on its own, never under the panel.
                In free size, the open panel pushes the host's page left by its width (sm:w-80), from 640px up:
                on <html>, so a host body with a max width centers in what is left instead of shrinking. */}
            {open && !compared && !size && <style>{"@media (min-width: 640px) { html { padding-right: 20rem; } }"}</style>}
            <div className={compared || size ? `fixed inset-0 z-40 overflow-auto bg-neutral-100 text-neutral-900 ${open ? "sm:right-80" : ""}` : undefined} data-lab-zone>
              {compared ? <CompareGrid axis={compared} size={size} /> : size ? <ViewportFrame width={size.width} height={size.height} /> : <Component />}
            </div>
            <LabPanel proto={ref(proto)} protos={protos.map(ref)} basePath={basePath} open={open} onOpenChange={setOpen} explore={explore} />
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
  // Inside a frame, the lab page can ask this page to designate an element (Request tab).
  const [designating, setDesignating] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;
    const onMessage = (e: MessageEvent) => {
      if (!sameOrigin(e)) return;
      if (e.data?.type === DESIGNATE) {
        setDesignating(true);
        window.parent.postMessage({ type: DESIGNATING }, window.location.origin);
      }
      if (e.data?.type === DESIGNATION_CANCELLED) setDesignating(false);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  const pick = useCallback((element: Designated) => {
    setDesignating(false);
    window.parent.postMessage({ type: DESIGNATED, element }, window.location.origin);
  }, []);
  const cancel = useCallback(() => {
    setDesignating(false);
    window.parent.postMessage({ type: DESIGNATION_CANCELLED }, window.location.origin);
  }, []);
  const root = useCallback(() => document.body, []);
  useDesignation(designating, pick, cancel, root);
  if (!size) return <>{children}</>;
  return (
    <div className="flex w-max min-w-full justify-center">
      <div style={{ width: size.width, height: size.height }} className="shrink-0 overflow-auto">
        {children}
      </div>
    </div>
  );
}
