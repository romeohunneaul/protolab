"use client";

import { Suspense, createContext, lazy, useCallback, useContext, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Axis, Loader, Scenario, Screen } from "./manifest";

type Lab = { axes: Axis[]; screens: Screen[]; scenarios: Scenario[] };
const LabContext = createContext<Lab>({ axes: [], screens: [], scenarios: [] });

/** Wrap a proto in its axes, screens and scenarios. The panel, useAxis(), useScreen(), useScenario() and <AxisSlot /> read from here. */
export function VariantProvider({ axes = [], screens = [], scenarios = [], children }: Partial<Lab> & { children: ReactNode }) {
  return <LabContext.Provider value={{ axes, screens, scenarios }}>{children}</LabContext.Provider>;
}

export const useLab = () => useContext(LabContext);

// The URL is the state (ADR 0004). Every param is optional and independent; an absent, unknown or
// malformed value falls back to the declared default, so a stale link never shows an unknown state.
type Params = { get(name: string): string | null };
export const axisParam = (key: string) => `a.${key}`;
export const scenarioParam = (key: string) => `s.${key}`;
export const SCREEN_PARAM = "screen";
export const STEP_PARAM = "step";

const pick = (values: { id: string }[], id: string | null, fallback?: string) =>
  id && values.some((v) => v.id === id) ? id : (fallback ?? values[0]?.id ?? "");

export const axisValue = (axis: Axis, params: Params) => pick(axis.values, params.get(axisParam(axis.key)), axis.default);
export const scenarioValue = (scenario: Scenario, params: Params) => pick(scenario.values, params.get(scenarioParam(scenario.key)), scenario.default);
export const screenValue = (screens: Screen[], params: Params) => {
  const key = params.get(SCREEN_PARAM);
  return key && screens.some((s) => s.key === key) ? key : (screens[0]?.key ?? "");
};
/** 1-based step of a screen: 1 when absent, malformed, out of range, or when the screen has no steps. */
export const stepValue = (screen: Screen | undefined, params: Params) => {
  const n = Number(params.get(STEP_PARAM));
  const max = screen?.steps?.length ?? 0;
  return Number.isInteger(n) && n >= 1 && n <= max ? n : 1;
};

/**
 * Write search params in one history entry: a string sets, null deletes. Nothing else in the URL
 * moves: the engine never removes a param it does not own. "push" (a screen, a step) adds an
 * entry and scrolls to the top; "replace" (an axis, a scenario, a size) keeps the entry and the scroll.
 */
export function useWriteParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return useCallback(
    (changes: Record<string, string | null>, history: "push" | "replace") => {
      const next = new URLSearchParams(params);
      for (const [key, value] of Object.entries(changes)) value === null ? next.delete(key) : next.set(key, value);
      const query = next.toString();
      router[history](query ? `${pathname}?${query}` : pathname, { scroll: history === "push" });
    },
    [router, pathname, params],
  );
}

/** Current value id of an axis, state or structural. Unknown key: "". */
export function useAxis(key: string): string {
  const { axes } = useLab();
  const params = useSearchParams();
  const axis = axes.find((a) => a.key === key);
  return axis ? axisValue(axis, params) : "";
}

/** Current screen and step, and how to move. Each move is one history entry, so Back walks the flow. */
export function useScreen(): {
  screen: string;
  go: (key: string, step?: number) => void;
  step: number;
  steps: string[];
  next: () => void;
  prev: () => void;
} {
  const { screens } = useLab();
  const params = useSearchParams();
  const write = useWriteParams();
  const screen = screenValue(screens, params);
  const current = screens.find((s) => s.key === screen);
  const steps = current?.steps ?? [];
  const step = stepValue(current, params);
  const go = useCallback(
    (key: string, at?: number) => {
      const target = screens.find((s) => s.key === key);
      if (!target) return;
      const valid = at !== undefined && Number.isInteger(at) && at >= 1 && at <= (target.steps?.length ?? 0);
      write({ [SCREEN_PARAM]: key, [STEP_PARAM]: valid ? String(at) : null }, "push");
    },
    [screens, write],
  );
  const next = useCallback(() => {
    if (step < steps.length) write({ [STEP_PARAM]: String(step + 1) }, "push");
  }, [step, steps.length, write]);
  const prev = useCallback(() => {
    if (step > 1) write({ [STEP_PARAM]: String(step - 1) }, "push");
  }, [step, write]);
  return { screen, go, step, steps, next, prev };
}

// A scenario's data set loads on the client, once per loader per page load; a second switch to the
// same value reloads nothing, a page reload does. A loader that fails surfaces as a render error.
type DataEntry = { status: "loading" | "done" | "error"; data?: unknown; error?: unknown; promise: Promise<void> };
const dataEntries = new WeakMap<() => Promise<unknown>, DataEntry>();
const dataEntryOf = (load: () => Promise<unknown>) => {
  let entry = dataEntries.get(load);
  if (!entry) {
    const e: DataEntry = { status: "loading", promise: Promise.resolve() };
    e.promise = load().then(
      (data) => void Object.assign(e, { status: "done", data }),
      (error) => void Object.assign(e, { status: "error", error }),
    );
    dataEntries.set(load, e);
    entry = e;
  }
  return entry;
};

/** Current value id of a scenario, and its loaded data. */
export function useScenario<T = unknown>(key: string): { id: string; data: T | undefined; loading: boolean } {
  const { scenarios } = useLab();
  const params = useSearchParams();
  const scenario = scenarios.find((s) => s.key === key);
  const id = scenario ? scenarioValue(scenario, params) : "";
  const load = scenario?.values.find((v) => v.id === id)?.data;
  const entry = load ? dataEntries.get(load) : undefined;
  const [, rerender] = useState(0);
  useEffect(() => {
    if (!load) return;
    const e = dataEntryOf(load);
    let on = true;
    if (e.status === "loading") e.promise.then(() => on && rerender((n) => n + 1));
    else rerender((n) => n + 1);
    return () => void (on = false);
  }, [load]);
  if (entry?.status === "error") throw entry.error;
  return { id, data: entry?.status === "done" ? (entry.data as T) : undefined, loading: !!load && entry?.status !== "done" };
}

// Components are resolved once per loader and cached, never re-created during a render.
const components = new WeakMap<Loader, ComponentType>();
export const componentOf = (load: Loader): ComponentType => {
  let component = components.get(load);
  if (!component) {
    component = lazy(load);
    components.set(load, component);
  }
  return component;
};

/**
 * Renders the component of the current value of a structural axis, where the proto places it.
 * Unknown key, or a state axis: renders nothing.
 */
export function AxisSlot({ axis }: { axis: string }): ReactNode {
  const { axes } = useLab();
  const params = useSearchParams();
  const found = axes.find((a) => a.key === axis);
  if (!found || found.kind !== "structural") return null;
  const load = found.values.find((v) => v.id === axisValue(found, params))?.load;
  if (!load) return null;
  const Component = componentOf(load);
  return (
    <Suspense fallback={null}>
      <Component />
    </Suspense>
  );
}
