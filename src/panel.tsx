"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  COMPARE_PARAM,
  LAB_PARAM,
  SCREEN_PARAM,
  STEP_PARAM,
  VIEWPORT_PARAM,
  axisParam,
  axisValue,
  compareValue,
  scenarioParam,
  scenarioValue,
  screenValue,
  stepValue,
  useLab,
  useWriteParams,
  viewportValue,
} from "./variants";
import { ExploreTab, type Seed } from "./explore";

type Ref = { slug: string; name: string; offDs?: boolean };
type Option = { id: string; label: string };
type Tab = "Variants" | "Viewport" | "Compare" | "Explore";

/** The viewport presets, the same for every host and every proto; a missing size goes in Custom. */
export const PRESETS: { label: string; width: number; height: number }[] = [
  { label: "Phone", width: 390, height: 844 },
  { label: "Tablet", width: 768, height: 1024 },
  { label: "Laptop", width: 1280, height: 800 },
  { label: "Desktop", width: 1440, height: 900 },
];

/**
 * The lab chrome on a proto page: a non-modal drawer on the right, with a header (back to the
 * index, the proto, the links), four tabs (Variants, Viewport, Compare, Explore) and the current state
 * in the footer. Collapses to a button. Its open state and tab are not lab state: not in the URL.
 */
export function LabPanel({
  proto,
  protos = [],
  basePath = "/lab",
  open,
  onOpenChange,
}: {
  proto: Ref;
  protos?: Ref[];
  basePath?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { axes, screens, scenarios } = useLab();
  const params = useSearchParams();
  const router = useRouter();
  const write = useWriteParams();
  const compared = compareValue(axes, params);
  const [tab, setTab] = useState<Tab>(compared ? "Compare" : "Variants");
  const [copied, setCopied] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  // A "+" next to an axis or a scenario opens Explore with its text ready to complete.
  const [seed, setSeed] = useState<Seed | undefined>(undefined);
  const explore = (text: string) => {
    setSeed((prev) => ({ text, n: (prev?.n ?? 0) + 1 }));
    setTab("Explore");
  };
  const search = params.toString();
  useEffect(() => setFallback(null), [search]);

  const copy = async (which: string, href: string) => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setFallback(href);
    }
  };
  const currentHref = () => location.href;
  const cleanHref = () => {
    const url = new URL(location.href);
    url.searchParams.set(LAB_PARAM, "0");
    return url.href;
  };

  if (!open) {
    return (
      <button type="button" onClick={() => onOpenChange(true)} className="fixed bottom-4 right-4 z-50 rounded-full bg-[#1c1c1c] px-3 py-1.5 text-xs text-white shadow-xl" data-lab-ui>
        Lab · {proto.name}
      </button>
    );
  }

  const button = "text-neutral-300 hover:text-white";
  const screen = screens.find((s) => s.key === screenValue(screens, params));
  const steps = screen?.steps ?? [];
  const size = viewportValue(params);
  const preset = size && PRESETS.find((p) => p.width === size.width && p.height === size.height);
  const sizeLabel = !size ? "Free size" : preset ? preset.label : `${size.width} × ${size.height}`;
  const state = [
    screen && `Screen: ${screen.label}`,
    steps.length > 0 && `Step: ${stepValue(screen, params)}. ${steps[stepValue(screen, params) - 1]}`,
    ...axes.map((a) => `${a.label}: ${a.values.find((v) => v.id === axisValue(a, params))?.label}`),
    ...scenarios.map((s) => `${s.label}: ${s.values.find((v) => v.id === scenarioValue(s, params))?.label}`),
    sizeLabel,
    compared && `Compare: ${compared.label}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-[#1c1c1c] text-white shadow-xl sm:w-80" data-lab-ui>
      <div className="border-b border-neutral-800 p-3 text-xs">
        <div className="mb-2 flex items-center justify-between">
          <Link href={basePath} className={button}>
            ← Lab
          </Link>
          <span className="flex gap-3">
            <button type="button" onClick={() => copy("link", currentHref())} className={button}>
              {copied === "link" ? "Copied" : "Copy link"}
            </button>
            <button type="button" onClick={() => copy("clean", cleanHref())} className={button}>
              {copied === "clean" ? "Copied" : "Copy clean link"}
            </button>
            <button type="button" onClick={() => onOpenChange(false)} className={button} aria-label="Collapse the lab panel">
              —
            </button>
          </span>
        </div>
        {protos.length > 1 ? (
          <Field label="Prototype" value={proto.slug} options={protos.map((p) => ({ id: p.slug, label: p.name }))} onChange={(slug) => router.push(`${basePath}/p/${slug}`)} />
        ) : (
          <p className="text-sm font-semibold">{proto.name}</p>
        )}
        {proto.offDs && <p className="mt-1 text-[10px] uppercase tracking-wide text-amber-400">Off design system</p>}
        {fallback && <input readOnly value={fallback} autoFocus onFocus={(e) => e.currentTarget.select()} className="mt-2 w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs" aria-label="Link to copy" />}
      </div>
      <nav className="flex border-b border-neutral-800 text-xs" role="tablist">
        {(["Variants", "Viewport", "Compare", "Explore"] as Tab[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex-1 px-3 py-2 ${tab === t ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"}`}>
            {t}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto p-3">
        <div hidden={tab !== "Variants"} className="grid gap-2">
            {screens.length === 0 && axes.length === 0 && scenarios.length === 0 && <p className="text-xs text-neutral-500">No variants declared yet</p>}
            {screens.length > 0 && (
              <Field label="Screen" value={screenValue(screens, params)} options={screens.map((s) => ({ id: s.key, label: s.label }))} onChange={(key) => write({ [SCREEN_PARAM]: key, [STEP_PARAM]: null }, "push")} />
            )}
            {steps.length > 0 && (
              <Field label="Step" value={String(stepValue(screen, params))} options={steps.map((label, i) => ({ id: String(i + 1), label: `${i + 1}. ${label}` }))} onChange={(n) => write({ [STEP_PARAM]: n }, "push")} />
            )}
            {axes.map((axis) => (
              <Field
                key={axis.key}
                label={axis.label}
                hint={compared?.key === axis.key ? "compared" : undefined}
                disabled={compared?.key === axis.key}
                value={axisValue(axis, params)}
                options={axis.values}
                onChange={(id) => write({ [axisParam(axis.key)]: id }, "replace")}
                onAdd={() => explore(`Add an option to "${axis.label}": `)}
              />
            ))}
            {scenarios.length > 0 && <p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-500">Scenarios</p>}
            {scenarios.map((scenario) => (
              <Field
                key={scenario.key}
                label={scenario.label}
                value={scenarioValue(scenario, params)}
                options={scenario.values}
                onChange={(id) => write({ [scenarioParam(scenario.key)]: id }, "replace")}
                onAdd={() => explore(`Add a case to "${scenario.label}": `)}
              />
            ))}
            <button type="button" onClick={() => explore("")} className="mt-1 justify-self-start rounded-md border border-dashed border-neutral-600 px-2 py-1 text-xs text-neutral-300 hover:border-neutral-400 hover:text-white">
              + Explore a variant
            </button>
        </div>
        <div hidden={tab !== "Viewport"}>
          <ViewportTab size={size} onChange={(v) => write({ [VIEWPORT_PARAM]: v }, "replace")} />
        </div>
        <div hidden={tab !== "Compare"}>
          {axes.length === 0 ? (
            <p className="text-xs text-neutral-500">No axis to compare</p>
          ) : (
            <CompareTab axes={axes.map((a) => ({ id: a.key, label: a.label }))} compared={compared?.key} onCompare={(key) => write({ [COMPARE_PARAM]: key }, "push")} onExit={() => write({ [COMPARE_PARAM]: null }, "push")} />
          )}
        </div>
        <div hidden={tab !== "Explore"}>
          <ExploreTab proto={proto} basePath={basePath} compared={!!compared} framed={!!size && !compared} seed={seed} />
        </div>
      </div>
      <p className="truncate border-t border-neutral-800 px-3 py-2 text-[10px] text-neutral-500" title={state} data-lab-state>
        {state}
      </p>
    </aside>
  );
}

function ViewportTab({ size, onChange }: { size: { width: number; height: number } | null; onChange: (v: string | null) => void }) {
  const preset = size && PRESETS.find((p) => p.width === size.width && p.height === size.height);
  const custom = size && !preset;
  const [w, setW] = useState(custom ? String(size.width) : "");
  const [h, setH] = useState(custom ? String(size.height) : "");
  const [editing, setEditing] = useState(!!custom);
  const positive = (v: string) => /^\d+$/.test(v) && Number(v) > 0;
  const row = (active: boolean) => `flex w-full items-baseline justify-between rounded px-2 py-1.5 text-left text-xs ${active ? "bg-neutral-800 text-white" : "text-neutral-300 hover:bg-neutral-800/60"}`;
  return (
    <div className="grid gap-1">
      <button type="button" aria-pressed={!size} onClick={() => onChange(null)} className={row(!size)}>
        <span>Free size</span>
      </button>
      {PRESETS.map((p) => (
        <button key={p.label} type="button" aria-pressed={preset?.label === p.label} onClick={() => onChange(`${p.width}x${p.height}`)} className={row(preset?.label === p.label)}>
          <span>{p.label}</span>
          <span className="text-neutral-500">{`${p.width} × ${p.height}`}</span>
        </button>
      ))}
      <button type="button" aria-pressed={!!custom} onClick={() => setEditing(true)} className={row(!!custom)}>
        <span>Custom</span>
        {custom && <span className="text-neutral-500">{`${size.width} × ${size.height}`}</span>}
      </button>
      {editing && (
        <form
          className="mt-1 flex items-end gap-2 px-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (positive(w) && positive(h)) onChange(`${Number(w)}x${Number(h)}`);
          }}
        >
          <label className="grid gap-0.5 text-[11px] text-neutral-400">
            Width
            <input value={w} onChange={(e) => setW(e.target.value)} inputMode="numeric" className="w-20 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-white" />
          </label>
          <label className="grid gap-0.5 text-[11px] text-neutral-400">
            Height
            <input value={h} onChange={(e) => setH(e.target.value)} inputMode="numeric" className="w-20 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-white" />
          </label>
          <button type="submit" disabled={!positive(w) || !positive(h)} className="rounded-md bg-white px-2 py-1 text-xs text-black disabled:opacity-40">
            Apply
          </button>
        </form>
      )}
    </div>
  );
}

function CompareTab({ axes, compared, onCompare, onExit }: { axes: Option[]; compared?: string; onCompare: (key: string) => void; onExit: () => void }) {
  const [choice, setChoice] = useState(compared ?? axes[0]?.id ?? "");
  return (
    <div className="grid gap-2">
      <Field label="Axis" value={compared ?? choice} options={axes} onChange={(key) => (compared ? onCompare(key) : setChoice(key))} />
      {compared ? (
        <button type="button" onClick={onExit} className="rounded-md bg-white px-2 py-1 text-xs text-black">
          Exit comparison
        </button>
      ) : (
        <button type="button" onClick={() => onCompare(choice)} className="rounded-md bg-white px-2 py-1 text-xs text-black">
          Compare
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  options,
  onChange,
  disabled,
  onAdd,
}: {
  label: ReactNode;
  hint?: string;
  value: string;
  options: Option[];
  onChange: (id: string) => void;
  disabled?: boolean;
  onAdd?: () => void;
}) {
  return (
    <label className="grid gap-0.5 text-[11px] text-neutral-400">
      <span className="flex items-center justify-between">
        <span>
          {label}
          {hint && <span className="ml-2 text-neutral-500">{hint}</span>}
        </span>
        {onAdd && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onAdd();
            }}
            aria-label={`Add an option to ${typeof label === "string" ? label : "this axis"}`}
            title="Add an option"
            className="rounded px-1.5 py-0.5 text-[11px] text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            + Add
          </button>
        )}
      </span>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-white disabled:opacity-50">
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
