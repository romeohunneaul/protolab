"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** A dimension of a proto: a state, a layout, a theme. Values are orthogonal — any combination is valid. */
export type Axis = { key: string; label: string; values: { id: string; label: string }[]; default?: string };

/** One view of a multi-screen proto (list, detail, settings…). The proto moves with useScreen().go. */
export type Screen = { key: string; label: string };

type Lab = { axes: Axis[]; screens: Screen[] };
const LabContext = createContext<Lab>({ axes: [], screens: [] });

/** Wrap a proto in its axes and screens. The panel, useAxis() and useScreen() read from here. */
export function VariantProvider({ axes, screens = [], children }: Lab & { children: ReactNode }) {
  return <LabContext.Provider value={{ axes, screens }}>{children}</LabContext.Provider>;
}

export const useLab = () => useContext(LabContext);

type Params = { get(name: string): string | null };
export const axisParam = (key: string) => `a.${key}`;
export const SCREEN_PARAM = "screen";

/** The URL value when it is a known one, else the default: a stale or mistyped link never yields an unknown state. */
export const axisValue = (axis: Axis, params: Params) => {
  const id = params.get(axisParam(axis.key));
  return id && axis.values.some((v) => v.id === id) ? id : (axis.default ?? axis.values[0]?.id ?? "");
};
export const screenValue = (screens: Screen[], params: Params) => {
  const key = params.get(SCREEN_PARAM);
  return key && screens.some((s) => s.key === key) ? key : (screens[0]?.key ?? "");
};

/** Write one search param without a reload. Axes replace the history entry; screens push one, so Back walks the flow. */
export function useSetParam() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return useCallback(
    (key: string, value: string, history: "push" | "replace" = "replace") => {
      const next = new URLSearchParams(params);
      next.set(key, value);
      router[history](`${pathname}?${next}`, { scroll: history === "push" });
    },
    [router, pathname, params],
  );
}

/** Read the current value of an axis. The URL is the source of truth, so a shared link restores the exact combination. */
export function useAxis(key: string): string {
  const { axes } = useLab();
  const params = useSearchParams();
  const axis = axes.find((a) => a.key === key);
  return axis ? axisValue(axis, params) : "";
}

/** The current screen, and `go(key)` to move to another one. Each screen has its own URL (`?screen=`). */
export function useScreen(): { screen: string; go: (key: string) => void } {
  const { screens } = useLab();
  const params = useSearchParams();
  const set = useSetParam();
  const go = useCallback((key: string) => set(SCREEN_PARAM, key, "push"), [set]);
  return { screen: screenValue(screens, params), go };
}
