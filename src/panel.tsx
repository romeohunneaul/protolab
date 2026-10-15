"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SCREEN_PARAM, STEP_PARAM, axisParam, axisValue, scenarioParam, scenarioValue, screenValue, stepValue, useLab, useWriteParams } from "./variants";

type Ref = { slug: string; name: string; offDs?: boolean };
type Option = { id: string; label: string };

/**
 * The lab chrome on a proto page: back to the index, jump to another proto, then this proto's
 * screen and step, axes and scenarios. Always rendered, even without axes, so every proto has a way out; collapsible
 * because it floats over the proto.
 */
export function LabPanel({ proto, protos = [], basePath = "/lab" }: { proto: Ref; protos?: Ref[]; basePath?: string }) {
  const { axes, screens, scenarios } = useLab();
  const params = useSearchParams();
  const router = useRouter();
  const write = useWriteParams();
  const screen = screens.find((s) => s.key === screenValue(screens, params));
  const steps = screen?.steps ?? [];
  const [open, setOpen] = useState(true);

  const button = "text-neutral-300 hover:text-white";
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-[#1c1c1c] px-3 py-1.5 text-xs text-white shadow-xl"
        data-lab-ui
      >
        Lab · {proto.name}
      </button>
    );
  }

  const current = [
    ...axes.map((a) => `${a.label}: ${a.values.find((v) => v.id === axisValue(a, params))?.label}`),
    ...scenarios.map((s) => `${s.label}: ${s.values.find((v) => v.id === scenarioValue(s, params))?.label}`),
  ].join(" · ");

  return (
    <aside className="fixed bottom-4 right-4 z-50 w-72 rounded-xl bg-[#1c1c1c] p-3 text-white shadow-xl" data-lab-ui>
      <div className="mb-2 flex items-center justify-between text-xs">
        <Link href={basePath} className={button}>
          ← Lab
        </Link>
        <span className="flex gap-3">
          <button type="button" onClick={() => navigator.clipboard.writeText(location.href)} className={button}>
            Copy link
          </button>
          <button type="button" onClick={() => setOpen(false)} className={button} aria-label="Collapse the lab panel">
            —
          </button>
        </span>
      </div>
      {proto.offDs && <p className="mb-2 text-[10px] uppercase tracking-wide text-amber-400">Off design system</p>}
      <div className="grid gap-2">
        {protos.length > 1 && (
          <Field
            label="Prototype"
            value={proto.slug}
            options={protos.map((p) => ({ id: p.slug, label: p.name }))}
            onChange={(slug) => router.push(`${basePath}/p/${slug}`)}
          />
        )}
        {screens.length > 0 && (
          <Field
            label="Screen"
            value={screenValue(screens, params)}
            options={screens.map((s) => ({ id: s.key, label: s.label }))}
            onChange={(key) => write({ [SCREEN_PARAM]: key, [STEP_PARAM]: null }, "push")}
          />
        )}
        {steps.length > 0 && (
          <Field
            label="Step"
            value={String(stepValue(screen, params))}
            options={steps.map((label, i) => ({ id: String(i + 1), label: `${i + 1}. ${label}` }))}
            onChange={(n) => write({ [STEP_PARAM]: n }, "push")}
          />
        )}
        {axes.map((axis) => (
          <Field
            key={axis.key}
            label={axis.label}
            value={axisValue(axis, params)}
            options={axis.values}
            onChange={(id) => write({ [axisParam(axis.key)]: id }, "replace")}
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
          />
        ))}
      </div>
      {current && (
        <p className="mt-2 truncate text-[10px] text-neutral-500" title={current}>
          {current}
        </p>
      )}
    </aside>
  );
}

function Field({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (id: string) => void }) {
  return (
    <label className="grid gap-0.5 text-[11px] text-neutral-400">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-white"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
