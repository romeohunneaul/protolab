"use client";

import { useEffect, useRef, type RefObject } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Axis } from "./manifest";
import { COMPARE_PARAM, LAB_PARAM, SCREEN_PARAM, STEP_PARAM, VIEWPORT_PARAM, axisParam, axisValue, useWriteParams } from "./variants";

// The viewport frame and each comparison cell are same-origin iframes that load the proto's clean
// page at the current link, without `v` and `compare` (ADR 0005). A frame has no state of its own:
// what it shows is in the lab URL, and a gesture made inside it is reported to the lab page
// (ADR 0007), which writes it in its own URL with the same history as from the panel.

const REPORT = "protolab:params";
type Report = { type: typeof REPORT; search: string };

/** The link a frame loads: the current params, plus `lab=0`, minus `v` and `compare`, plus the cell's axis value. */
export function internalSearch(params: URLSearchParams, cell?: { axis: string; id: string }) {
  const next = new URLSearchParams(params);
  next.set(LAB_PARAM, "0");
  next.delete(VIEWPORT_PARAM);
  next.delete(COMPARE_PARAM);
  if (cell) next.set(axisParam(cell.axis), cell.id);
  return next.toString();
}

/** In the clean page, inside a frame: tell the lab page what the URL is, on every change. */
export function useReportToParent() {
  const params = useSearchParams();
  const search = params.toString();
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;
    const report: Report = { type: REPORT, search };
    window.parent.postMessage(report, window.location.origin);
  }, [search]);
}

/**
 * In the lab page: when a frame reports a URL, write what changed into the lab URL. A screen or a
 * step pushes an entry, like from the panel; the frame's own `lab=0` and the compared axis are ignored.
 */
export function useFrameReports(ignoredAxis?: string) {
  const params = useSearchParams();
  const write = useWriteParams();
  useEffect(() => {
    const onMessage = (event: MessageEvent<Report>) => {
      if (event.origin !== window.location.origin || event.data?.type !== REPORT) return;
      const reported = new URLSearchParams(event.data.search);
      const changes: Record<string, string | null> = {};
      let push = false;
      for (const key of new Set([...reported.keys(), ...params.keys()])) {
        if (key === LAB_PARAM || key === VIEWPORT_PARAM || key === COMPARE_PARAM) continue;
        if (ignoredAxis && key === axisParam(ignoredAxis)) continue;
        const value = reported.get(key);
        if (value === params.get(key)) continue;
        changes[key] = value;
        if (key === SCREEN_PARAM || key === STEP_PARAM) push = true;
      }
      if (Object.keys(changes).length) write(changes, push ? "push" : "replace");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [params, write, ignoredAxis]);
}

/** One frame: loads the internal link once, then follows the lab URL without reloading what it already shows. */
function Frame({ search, width, height, className, title }: { search: string; width?: number; height?: number; className?: string; title: string }) {
  const pathname = usePathname();
  const ref: RefObject<HTMLIFrameElement | null> = useRef(null);
  const initial = useRef(`${pathname}?${search}`);
  useEffect(() => {
    const frame = ref.current;
    const wanted = `${pathname}?${search}`;
    const current = frame?.contentWindow?.location;
    if (!frame || !current) return;
    if (`${current.pathname}${current.search}` !== wanted) current.replace(wanted);
  }, [pathname, search]);
  return (
    <iframe
      ref={ref}
      src={initial.current}
      title={title}
      style={width && height ? { width, height } : undefined}
      className={`block border-0 bg-white ${className ?? ""}`}
      data-lab-frame
    />
  );
}

/** The viewport: the proto's clean page at the link's size, exact pixels, top of the render zone, centered. */
export function ViewportFrame({ width, height }: { width: number; height: number }) {
  const params = useSearchParams();
  useFrameReports();
  return (
    <div className="flex justify-center pt-4">
      <Frame search={internalSearch(params)} width={width} height={height} className="rounded-md shadow ring-1 ring-black/10" title="Viewport" />
    </div>
  );
}

/** The comparison view: one cell per value of the compared axis, each a clean page at that value. */
export function CompareGrid({ axis, size }: { axis: Axis; size: { width: number; height: number } | null }) {
  const params = useSearchParams();
  const write = useWriteParams();
  useFrameReports(axis.key);
  const current = axisValue(axis, params);
  const open = (id: string) => write({ [axisParam(axis.key)]: id, [COMPARE_PARAM]: null }, "push");
  return (
    <div className={size ? "flex flex-wrap gap-4 p-4" : "grid gap-4 p-4 grid-cols-[repeat(auto-fit,minmax(360px,1fr))]"} data-lab-compare>
      {axis.values.map((value) => (
        <section key={value.id} className={size ? "" : "flex min-h-[calc(100vh-6rem)] flex-col"} data-lab-cell={value.id}>
          <header className="mb-1 flex items-baseline justify-between gap-3 text-xs">
            <span className="font-medium">
              {value.label}
              {value.id === current && <span className="ml-2 rounded-full bg-neutral-900 px-1.5 py-0.5 text-[10px] text-white">current</span>}
            </span>
            <button type="button" onClick={() => open(value.id)} className="text-neutral-500 hover:underline">
              Open
            </button>
          </header>
          <Frame
            search={internalSearch(params, { axis: axis.key, id: value.id })}
            width={size?.width}
            height={size?.height}
            className={`rounded-md shadow ring-1 ring-black/10 ${size ? "" : "w-full flex-1"}`}
            title={`${axis.label}: ${value.label}`}
          />
        </section>
      ))}
    </div>
  );
}
