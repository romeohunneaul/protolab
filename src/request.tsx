"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Axis, Scenario, Screen } from "./manifest";
import { DESIGNATE, DESIGNATED, DESIGNATING, DESIGNATION_CANCELLED, sameOrigin, useDesignation, type Designated } from "./designate";
import { axisValue, scenarioValue, screenValue, stepValue, useLab, viewportValue } from "./variants";

// The Request tab: three requests that produce a prompt and nothing else. The prompt is composed in
// the page from the manifest, the link, the rendered page and the form; it leaves through the
// clipboard or the Claude Desktop deep link. A draft is not lab state: it is not in the URL.

type Kind = "axis" | "component" | "scenario";
const KINDS: { kind: Kind; label: string; heading: string }[] = [
  { kind: "axis", label: "Add an axis or a value", heading: "add an axis or a value" },
  { kind: "component", label: "Change this component", heading: "change this component" },
  { kind: "scenario", label: "Add a scenario", heading: "add a scenario" },
];
const NEW = "__new__";

export function RequestTab({ proto, compared, framed }: { proto: { slug: string; name: string }; compared: boolean; framed: boolean }) {
  const { axes, screens, scenarios } = useLab();
  const params = useSearchParams();
  const [kind, setKind] = useState<Kind | null>(null);
  const [target, setTarget] = useState(NEW);
  const [label, setLabel] = useState("");
  const [values, setValues] = useState("");
  const [intent, setIntent] = useState("");
  const [element, setElement] = useState<Designated | null>(null);
  const [designating, setDesignating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const preview = useRef<HTMLTextAreaElement>(null);

  // A state change (screen, step, axis, scenario, size) after a designation clears it: the element may be gone.
  const state = params.toString();
  const designatedAt = useRef<string | null>(null);
  useEffect(() => {
    if (element && designatedAt.current !== null && designatedAt.current !== state) {
      setElement(null);
      setNotice("Designation cleared: the state changed");
    }
  }, [state, element]);

  const choose = (k: Kind) => {
    setKind(k);
    setTarget(k === "axis" && axes.length ? axes[0].key : k === "scenario" && scenarios.length ? scenarios[0].key : NEW);
    setLabel("");
    setValues("");
    setIntent("");
    setElement(null);
    setNotice(null);
    setFailed(false);
  };
  const clear = () => {
    setKind(null);
    setElement(null);
    setNotice(null);
    setFailed(false);
  };

  // Designation, in the page or in the viewport frame.
  const onPick = useCallback(
    (d: Designated) => {
      setElement(d);
      designatedAt.current = params.toString();
      setDesignating(false);
      setNotice(null);
    },
    [params],
  );
  const onCancel = useCallback(() => setDesignating(false), []);
  const root = useCallback(() => document.querySelector("[data-lab-zone]"), []);
  useDesignation(designating && !framed, onPick, onCancel, root);
  useEffect(() => {
    if (!designating || !framed) return;
    const frame = document.querySelector<HTMLIFrameElement>("iframe[data-lab-frame]");
    // The frame may still be loading: ask until it acknowledges.
    const ask = () => frame?.contentWindow?.postMessage({ type: DESIGNATE }, window.location.origin);
    ask();
    const retry = window.setInterval(ask, 250);
    const onMessage = (e: MessageEvent) => {
      if (!sameOrigin(e)) return;
      if (e.data?.type === DESIGNATING) window.clearInterval(retry);
      if (e.data?.type === DESIGNATED) onPick(e.data.element as Designated);
      if (e.data?.type === DESIGNATION_CANCELLED) onCancel();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", key);
    return () => {
      window.clearInterval(retry);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", key);
      frame?.contentWindow?.postMessage({ type: DESIGNATION_CANCELLED }, window.location.origin);
    };
  }, [designating, framed, onPick, onCancel]);

  const axis = axes.find((a) => a.key === target);
  const scenario = scenarios.find((s) => s.key === target);
  const options = values.split(/[\n,]/).map((v) => v.trim()).filter(Boolean);
  const missing = {
    label: (kind === "axis" || kind === "scenario") && target === NEW && !label.trim(),
    values: (kind === "axis" || kind === "scenario") && options.length === 0,
    element: kind === "component" && !element,
    intent: !intent.trim(),
  };
  const ready = kind !== null && !Object.values(missing).some(Boolean);

  const prompt = useMemo(
    () => (kind ? composePrompt({ kind, proto, axes, screens, scenarios, params, axis, scenario, label, element, options, intent }) : ""),
    [kind, proto, axes, screens, scenarios, params, axis, scenario, label, element, options, intent],
  );

  const copy = async (thenOpen: boolean) => {
    const text = composePrompt({ kind: kind!, proto, axes, screens, scenarios, params, axis, scenario, label, element, options, intent });
    try {
      await navigator.clipboard.writeText(text);
      setFailed(false);
      setNotice(thenOpen ? "Prompt copied · opening Claude Desktop" : "Prompt copied");
      setTimeout(() => setNotice(null), 2000);
      if (thenOpen) window.location.href = `claude://code/new?q=${encodeURIComponent(text)}`;
    } catch {
      setFailed(true);
      setNotice("Copy failed: select the prompt and copy it");
      preview.current?.focus();
      preview.current?.select();
    }
  };

  const field = "w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-white";
  const labelCls = "grid gap-0.5 text-[11px] text-neutral-400";
  const required = <span className="ml-1 text-amber-400">Required</span>;

  if (kind === null) {
    return (
      <div className="grid gap-1">
        {KINDS.map((k) => (
          <button key={k.kind} type="button" onClick={() => choose(k.kind)} disabled={k.kind === "component" && compared} className="rounded px-2 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800/60 disabled:opacity-50">
            {k.label}
            {k.kind === "component" && compared && <span className="block text-[10px] text-neutral-500">Open a cell to change a component</span>}
          </button>
        ))}
        {notice && <p className="mt-2 text-[11px] text-neutral-400">{notice}</p>}
      </div>
    );
  }

  return (
    <div className="grid gap-2" data-lab-request={kind}>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium">{KINDS.find((k) => k.kind === kind)!.label}</span>
        <button type="button" onClick={clear} className="text-neutral-400 hover:text-white">
          Clear
        </button>
      </div>
      {kind === "axis" && (
        <>
          <label className={labelCls}>
            Axis
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={field}>
              {axes.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
              <option value={NEW}>New axis</option>
            </select>
          </label>
          {target === NEW && (
            <label className={labelCls}>
              <span>Axis label{missing.label && required}</span>
              <input value={label} onChange={(e) => setLabel(e.target.value)} className={field} />
            </label>
          )}
          {axis && <p className="text-[10px] text-neutral-500">Current values: {axis.values.map((v) => v.label).join(", ")}</p>}
        </>
      )}
      {kind === "scenario" && (
        <>
          <label className={labelCls}>
            Scenario
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={field}>
              {scenarios.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
              <option value={NEW}>New scenario</option>
            </select>
          </label>
          {target === NEW && (
            <label className={labelCls}>
              <span>Scenario label{missing.label && required}</span>
              <input value={label} onChange={(e) => setLabel(e.target.value)} className={field} />
            </label>
          )}
          {scenario && <p className="text-[10px] text-neutral-500">Current values: {scenario.values.map((v) => v.label).join(", ")}</p>}
        </>
      )}
      {kind === "component" && (
        <div className="grid gap-1 text-xs">
          {element ? (
            <p className="rounded bg-neutral-800 px-2 py-1" data-lab-designated>
              <code>&lt;{element.tag}&gt;</code> {element.text && `“${element.text}”`}
              <span className="block truncate text-[10px] text-neutral-500" title={element.path}>
                {element.path}
              </span>
            </p>
          ) : (
            missing.element && <p className="text-[11px] text-neutral-400">The element{required}</p>
          )}
          {designating ? (
            <p className="text-[11px] text-amber-400">Click an element in the prototype · Esc to cancel</p>
          ) : (
            <button type="button" onClick={() => setDesignating(true)} className="rounded-md bg-white px-2 py-1 text-xs text-black">
              {element ? "Designate again" : "Designate an element"}
            </button>
          )}
        </div>
      )}
      <label className={labelCls}>
        <span>
          {kind === "component" ? "Options" : "Values"}
          {missing.values && required}
        </span>
        <textarea value={values} onChange={(e) => setValues(e.target.value)} rows={2} placeholder={kind === "component" ? "alternatives, one per line" : "one per line, or comma-separated"} className={field} />
      </label>
      <label className={labelCls}>
        <span>Intent{missing.intent && required}</span>
        <textarea value={intent} onChange={(e) => setIntent(e.target.value)} rows={2} className={field} />
      </label>
      <textarea ref={preview} readOnly value={prompt} rows={6} aria-label="Prompt" className={`${field} font-mono text-[10px] text-neutral-300`} data-lab-prompt />
      <div className="flex gap-2">
        <button type="button" disabled={!ready} onClick={() => copy(false)} className="rounded-md bg-white px-2 py-1 text-xs text-black disabled:opacity-40">
          Copy prompt
        </button>
        <button type="button" disabled={!ready} onClick={() => copy(true)} className="rounded-md border border-neutral-600 px-2 py-1 text-xs disabled:opacity-40">
          Open in Claude Desktop
        </button>
      </div>
      {notice && <p className={`text-[11px] ${failed ? "text-amber-400" : "text-neutral-400"}`}>{notice}</p>}
    </div>
  );
}

function composePrompt(input: {
  kind: Kind;
  proto: { slug: string; name: string };
  axes: Axis[];
  screens: Screen[];
  scenarios: Scenario[];
  params: URLSearchParams;
  axis?: Axis;
  scenario?: Scenario;
  label: string;
  element: Designated | null;
  options: string[];
  intent: string;
}) {
  const { kind, proto, axes, screens, scenarios, params, axis, scenario, label, element, options, intent } = input;
  const screen = screens.find((s) => s.key === screenValue(screens, params));
  const size = viewportValue(params);
  const state = [
    screen ? `screen: ${screen.label} (${screen.key})${screen.steps?.length ? ` step ${stepValue(screen, params)}/${screen.steps.length}` : ""}` : "screen: (single screen)",
    ...axes.map((a) => {
      const v = a.values.find((x) => x.id === axisValue(a, params));
      return `${a.key}: ${v?.label} (${v?.id})${a.kind === "structural" ? ", structural" : ""}`;
    }),
    ...scenarios.map((s) => {
      const v = s.values.find((x) => x.id === scenarioValue(s, params));
      return `scenario ${s.key}: ${v?.label} (${v?.id})`;
    }),
    size ? `viewport: ${size.width}x${size.height}` : "viewport: free size",
  ].join(" · ");
  const list = (vs: { label: string; id: string }[]) => vs.map((v) => `${v.label} (${v.id})`).join(", ");
  const target =
    kind === "axis"
      ? axis
        ? `Axis: ${axis.label} ("${axis.key}", ${axis.kind ?? "state"}) with values: ${list(axis.values)}`
        : `New axis: "${label.trim()}"`
      : kind === "scenario"
        ? scenario
          ? `Scenario: ${scenario.label} ("${scenario.key}") with values: ${list(scenario.values)}`
          : `New scenario: "${label.trim()}"`
        : element
          ? `Element: <${element.tag}>${element.text ? ` "${element.text}"` : ""}\n  path: ${element.path}${element.attributes ? `\n  attributes: ${element.attributes}` : ""}`
          : "Element: (not designated)";
  const guidance = {
    axis: "- For a new axis, choose its kind (state or structural) from the intent and say which one; a new value of a structural axis needs its own component.",
    component: "- The element was rendered in the state above: a block that comes from a structural axis lives in the component of that axis's current value.",
    scenario: "- A scenario carries data, never a mode of the screen: if the request describes a mode (empty, error), say so instead of writing a scenario. Write one data set per value.",
  }[kind];
  const href = typeof window === "undefined" ? "" : window.location.href;
  return [
    `Protolab request: ${KINDS.find((k) => k.kind === kind)!.heading}`,
    "",
    `Proto: ${proto.name} (slug "${proto.slug}"). Read protolab.config.json at the project root first: it declares the manifest file and the protos folder. This proto is the manifest entry with slug "${proto.slug}"; its files are in "<protos folder>/${proto.slug}/".`,
    `State: ${href}`,
    `  ${state}`,
    target,
    `Options: ${options.length ? "\n" + options.map((o) => `  - ${o}`).join("\n") : "(none)"}`,
    `Intent: ${intent.trim()}`,
    "",
    "Apply this request in this project with the Protolab skills (in .claude/skills/; run `npx protolab-skills` if they are missing).",
    "- Change only this proto: its files and its manifest entry.",
    "- Reuse the host's components without restyling them; do not edit the design system or the engine.",
    guidance,
    "- Keep the link above valid: this state must still render after the change.",
    "- Run `npx protolab-check`, then say what changed.",
  ].join("\n");
}
