"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** A dimension of a proto: a state, a layout, a theme. Values are orthogonal — any combination is valid. */
export type Axis = { key: string; label: string; values: { id: string; label: string }[]; default?: string };

const AxesContext = createContext<Axis[]>([]);

/** Wrap a proto in its axes. The switcher and every useAxis() read from here. */
export function VariantProvider({ axes, children }: { axes: Axis[]; children: ReactNode }) {
  return <AxesContext.Provider value={axes}>{children}</AxesContext.Provider>;
}

const paramKey = (key: string) => `a.${key}`;

/** Read the current value of an axis. The URL is the source of truth, so a shared link restores the exact combination. */
export function useAxis(key: string): string {
  const axes = useContext(AxesContext);
  const params = useSearchParams();
  const axis = axes.find((a) => a.key === key);
  return params.get(paramKey(key)) ?? axis?.default ?? axis?.values[0]?.id ?? "";
}

/** Dropdowns for every axis, synced to the URL without a reload (state and scroll survive). */
export function VariantSwitcher() {
  const axes = useContext(AxesContext);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const value = useCallback(
    (axis: Axis) => params.get(paramKey(axis.key)) ?? axis.default ?? axis.values[0]?.id ?? "",
    [params],
  );
  const set = (axis: Axis, id: string) => {
    const next = new URLSearchParams(params);
    next.set(paramKey(axis.key), id);
    router.replace(`${pathname}?${next}`, { scroll: false });
  };
  const copy = () => navigator.clipboard.writeText(location.href);

  const current = useMemo(
    () => axes.map((a) => `${a.label}: ${a.values.find((v) => v.id === value(a))?.label}`).join(" · "),
    [axes, value],
  );
  if (axes.length === 0) return null;

  return (
    <aside className="fixed bottom-4 left-4 z-50 w-72 rounded-xl bg-[#1c1c1c] p-3 text-white shadow-xl" data-lab-ui>
      <div className="mb-2 flex items-center justify-between">
        <strong className="text-xs uppercase tracking-wide text-neutral-400">Variants</strong>
        <button type="button" onClick={copy} className="text-xs text-neutral-300 hover:text-white">
          Copy link
        </button>
      </div>
      <div className="grid gap-2">
        {axes.map((axis) => (
          <label key={axis.key} className="grid gap-0.5 text-[11px] text-neutral-400">
            {axis.label}
            <select
              value={value(axis)}
              onChange={(e) => set(axis, e.target.value)}
              className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-white"
            >
              {axis.values.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p className="mt-2 truncate text-[10px] text-neutral-500" title={current}>
        {current}
      </p>
    </aside>
  );
}
