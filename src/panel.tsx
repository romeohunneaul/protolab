"use client";

import Link from "next/link";
import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from "react";
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
import { ExploreTab } from "./explore";

type Ref = { slug: string; name: string; offDs?: boolean };
type Option = { id: string; label: string };
type Tab = "Variants" | "Explore";

/** The viewport presets, the same for every host and every proto; a missing size goes in Custom. */
export const PRESETS: { label: string; width: number; height: number }[] = [
  { label: "Phone", width: 390, height: 844 },
  { label: "Tablet", width: 768, height: 1024 },
  { label: "Laptop", width: 1280, height: 800 },
  { label: "Desktop", width: 1440, height: 900 },
];

/** Up to this many values, a field is a row of buttons (one click); beyond, a select. */
const SEGMENTED_MAX = 4;

// The panel sets what it must not inherit from the host: the font, dark form controls, a focus ring
// that reads on its dark background.
const CHROME = "font-sans [color-scheme:dark] [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-sky-400";

/**
 * The lab chrome on a proto page: a non-modal drawer on the right. The header holds what applies to
 * the whole page (back to the index, the proto, the links, the viewport); `Variants` holds one field
 * per screen, step, axis and scenario, each axis with its `Compare`; `Explore`, when enabled, composes
 * a request for Claude Code. The current state is in the footer. Collapses to a button. Its open state
 * and tab are not lab state: not in the URL.
 */
export function LabPanel({
  proto,
  protos = [],
  basePath = "/lab",
  open,
  onOpenChange,
  explore = false,
}: {
  proto: Ref;
  protos?: Ref[];
  basePath?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Show the Explore tab. It needs the host repo and Claude Code: an author's tool, off for reviewers. */
  explore?: boolean;
}) {
  const { axes, screens, scenarios } = useLab();
  const params = useSearchParams();
  const router = useRouter();
  const write = useWriteParams();
  const compared = compareValue(axes, params);
  const tabs: Tab[] = explore ? ["Variants", "Explore"] : ["Variants"];
  const [tab, setTab] = useState<Tab>("Variants");
  const [copied, setCopied] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const search = params.toString();
  useEffect(() => setFallback(null), [search]);
  const id = useId();
  // Tabs follow the ARIA pattern: arrows, Home and End move the selection and the focus together.
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.indexOf(tab);
    const to = ({ ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 } as Record<string, number>)[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = tabs[(to + tabs.length) % tabs.length];
    setTab(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

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

  const button = "inline-flex min-h-6 items-center rounded px-1 text-neutral-300 hover:text-white";
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

  const variants = (
    <div className="grid gap-3">
      {screens.length === 0 && axes.length === 0 && scenarios.length === 0 && (
        <>
          <p className="text-xs text-neutral-400">No variants declared yet</p>
          <p className="text-[11px] text-neutral-400">Declare screens, axes or scenarios in this proto&apos;s manifest entry.</p>
        </>
      )}
      {screens.length > 0 && (
        <Field label="Screen" value={screenValue(screens, params)} options={screens.map((s) => ({ id: s.key, label: s.label }))} onChange={(key) => write({ [SCREEN_PARAM]: key, [STEP_PARAM]: null }, "push")} />
      )}
      {steps.length > 0 && (
        <Field label="Step" value={String(stepValue(screen, params))} options={steps.map((label, i) => ({ id: String(i + 1), label: `${i + 1}. ${label}` }))} onChange={(n) => write({ [STEP_PARAM]: n }, "push")} />
      )}
      {axes.map((axis) => {
        const isCompared = compared?.key === axis.key;
        return (
          <Field
            key={axis.key}
            label={axis.label}
            hint={isCompared ? "all values, compared" : undefined}
            disabled={isCompared}
            value={isCompared ? "" : axisValue(axis, params)}
            options={axis.values}
            onChange={(id) => write({ [axisParam(axis.key)]: id }, "replace")}
            action={
              axis.values.length > 1 && (
                <button
                  type="button"
                  aria-pressed={isCompared}
                  aria-label={`Compare ${axis.label}`}
                  title={isCompared ? "Leave the comparison" : "Show every value side by side"}
                  onClick={() => write({ [COMPARE_PARAM]: isCompared ? null : axis.key }, "push")}
                  className={`min-h-6 rounded px-1.5 text-[11px] ${isCompared ? "bg-white text-black" : "text-neutral-300 hover:bg-neutral-800 hover:text-white"}`}
                >
                  Compare
                </button>
              )
            }
          />
        );
      })}
      {scenarios.length > 0 && <p className="mt-1 text-[11px] uppercase tracking-wide text-neutral-400">Scenarios</p>}
      {scenarios.map((scenario) => (
        <Field key={scenario.key} label={scenario.label} value={scenarioValue(scenario, params)} options={scenario.values} onChange={(id) => write({ [scenarioParam(scenario.key)]: id }, "replace")} />
      ))}
    </div>
  );

  // Collapsed, the panel stays mounted and hidden, so an Explore draft survives a collapse.
  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="fixed bottom-4 right-4 z-50 rounded-full bg-[#1c1c1c] px-3 py-1.5 font-sans text-xs text-white shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          data-lab-ui
        >
          Lab · {proto.name}
        </button>
      )}
      <aside className={`fixed inset-y-0 right-0 z-50 ${open ? "flex" : "hidden"} w-full flex-col bg-[#1c1c1c] text-white shadow-xl sm:w-80 ${CHROME}`} data-lab-ui>
        <div className="grid gap-2 border-b border-neutral-800 p-3 text-xs">
          <div className="flex items-center justify-between">
            <Link href={basePath} className={button}>
              ← Lab
            </Link>
            <span className="flex gap-2">
              <button type="button" onClick={() => copy("link", currentHref())} className={button}>
                {copied === "link" ? "Copied" : "Copy link"}
              </button>
              <button type="button" onClick={() => copy("clean", cleanHref())} className={button}>
                {copied === "clean" ? "Copied" : "Copy clean link"}
              </button>
              <button type="button" onClick={() => onOpenChange(false)} className={`${button} min-w-6 justify-center`} aria-label="Collapse the lab panel">
                —
              </button>
            </span>
            <span className="sr-only" aria-live="polite">
              {copied && "Link copied"}
            </span>
          </div>
          <div>
            {protos.length > 1 ? (
              <Field label="Prototype" value={proto.slug} options={protos.map((p) => ({ id: p.slug, label: p.name }))} onChange={(slug) => router.push(`${basePath}/p/${slug}`)} segmented={false} />
            ) : (
              <p className="text-sm font-semibold">{proto.name}</p>
            )}
            {proto.offDs && <p className="mt-1 text-[11px] uppercase tracking-wide text-amber-400">Off design system</p>}
          </div>
          <Viewport size={size} onChange={(v) => write({ [VIEWPORT_PARAM]: v }, "replace")} />
          {fallback && <input readOnly value={fallback} autoFocus onFocus={(e) => e.currentTarget.select()} className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs" aria-label="Link to copy" />}
        </div>
        {tabs.length > 1 && (
          <div className="flex border-b border-neutral-800 text-xs" role="tablist" aria-label="Lab panel" onKeyDown={onTabKey}>
            {tabs.map((t) => (
              <button
                key={t}
                id={`${id}-tab-${t}`}
                type="button"
                role="tab"
                aria-selected={tab === t}
                aria-controls={`${id}-panel-${t}`}
                tabIndex={tab === t ? 0 : -1}
                onClick={() => setTab(t)}
                className={`flex-1 px-3 py-2 ${tab === t ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-3">
          {explore ? (
            <>
              <div {...tabPanel(id, "Variants", tab)}>{variants}</div>
              <div {...tabPanel(id, "Explore", tab)}>
                <ExploreTab proto={proto} basePath={basePath} compared={!!compared} framed={!!size && !compared} />
              </div>
            </>
          ) : (
            variants
          )}
        </div>
        <p className="truncate border-t border-neutral-800 px-3 py-2 text-[11px] text-neutral-400" title={state} data-lab-state>
          {state}
        </p>
      </aside>
    </>
  );
}

const tabPanel = (id: string, t: Tab, current: Tab) => ({ id: `${id}-panel-${t}`, role: "tabpanel", "aria-labelledby": `${id}-tab-${t}`, hidden: current !== t });

/** The viewport, in the header: it applies to the whole page, whatever the tab. */
function Viewport({ size, onChange }: { size: { width: number; height: number } | null; onChange: (v: string | null) => void }) {
  const preset = size && PRESETS.find((p) => p.width === size.width && p.height === size.height);
  const custom = !!size && !preset;
  const [editing, setEditing] = useState(false);
  const [w, setW] = useState(custom ? String(size.width) : "");
  const [h, setH] = useState(custom ? String(size.height) : "");
  const positive = (v: string) => /^\d+$/.test(v) && Number(v) > 0;
  const options = [
    { id: "free", label: "Free size" },
    ...PRESETS.map((p) => ({ id: `${p.width}x${p.height}`, label: `${p.label} · ${p.width} × ${p.height}` })),
    { id: "custom", label: custom ? `Custom · ${size.width} × ${size.height}` : "Custom…" },
  ];
  const value = editing || custom ? "custom" : size ? `${size.width}x${size.height}` : "free";
  return (
    <div className="grid gap-1">
      <Field
        label="Viewport"
        value={value}
        options={options}
        segmented={false}
        onChange={(v) => {
          setEditing(v === "custom");
          if (v !== "custom") onChange(v === "free" ? null : v);
        }}
      />
      {(editing || custom) && (
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (positive(w) && positive(h)) {
              onChange(`${Number(w)}x${Number(h)}`);
              setEditing(false);
            }
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

/**
 * One choice among values. Up to SEGMENTED_MAX values: a radio group of buttons, one click to switch,
 * arrows to move; beyond: a select. A value that is none of the options (the compared axis) checks
 * nothing. The label names the control alone; `action` sits next to it, never inside it.
 */
function Field({
  label,
  hint,
  value,
  options,
  onChange,
  disabled,
  action,
  segmented = options.length <= SEGMENTED_MAX,
}: {
  label: string;
  hint?: string;
  value: string;
  options: Option[];
  onChange: (id: string) => void;
  disabled?: boolean;
  action?: ReactNode;
  segmented?: boolean;
}) {
  const id = useId();
  const known = options.some((o) => o.id === value);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[e.key];
    if (!step || disabled) return;
    e.preventDefault();
    const i = (Math.max(0, options.findIndex((o) => o.id === value)) + step + options.length) % options.length;
    onChange(options[i].id);
    e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]")[i]?.focus();
  };
  return (
    <div className="grid gap-1 text-[11px] text-neutral-400">
      <span className="flex min-h-6 items-center justify-between">
        <span>
          {segmented ? <span id={id}>{label}</span> : <label htmlFor={id}>{label}</label>}
          {hint && <span className="ml-2 text-neutral-300">{hint}</span>}
        </span>
        {action}
      </span>
      {segmented ? (
        <div role="radiogroup" aria-labelledby={id} aria-disabled={disabled || undefined} onKeyDown={onKey} className="flex flex-wrap gap-1">
          {options.map((o, i) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={o.id === value}
              tabIndex={o.id === value || (!known && i === 0) ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(o.id)}
              className={`min-h-6 rounded-md border px-2 py-0.5 text-xs disabled:opacity-50 ${
                o.id === value ? "border-white bg-white text-black" : "border-neutral-700 bg-neutral-900 text-white hover:border-neutral-500"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <select id={id} value={known ? value : ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-white disabled:opacity-50">
          {!known && <option value="">{hint ?? "—"}</option>}
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
