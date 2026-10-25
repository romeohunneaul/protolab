"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Axis, Scenario, Screen } from "./manifest";
import { DESIGNATE, DESIGNATED, DESIGNATING, DESIGNATION_CANCELLED, sameOrigin, useDesignation, type Designated } from "./designate";
import { axisValue, scenarioValue, screenValue, stepValue, useLab, viewportValue } from "./variants";

// The Explore tab: one field, "what do you want to try?", and an optional designated element. The
// lab composes a prompt from the manifest, the link, the element and the text; Claude Code, opened
// on the host repo, decides what it is (a value, an axis, approaches, a scenario) with the Protolab
// skills and writes it. The lab writes no code and calls no service. A draft is not lab state.

const EXAMPLES = [
  "Try the filters in a side panel instead of above the list",
  "Add a compact density",
  "Propose 3 approaches of this page",
  "Test with 0, 12 and 500 items",
];

export function ExploreTab({
  proto,
  basePath,
  compared,
  framed,
}: {
  proto: { slug: string; name: string };
  basePath: string;
  compared: boolean;
  framed: boolean;
}) {
  const { axes, screens, scenarios } = useLab();
  const params = useSearchParams();
  const [text, setText] = useState("");
  const [element, setElement] = useState<Designated | null>(null);
  const [designating, setDesignating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
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

  const ready = text.trim().length > 0;
  const prompt = useMemo(
    () => (ready ? composePrompt({ proto, basePath, axes, screens, scenarios, params, element, text }) : ""),
    [ready, proto, basePath, axes, screens, scenarios, params, element, text],
  );

  const copy = async (thenOpen: boolean) => {
    const value = composePrompt({ proto, basePath, axes, screens, scenarios, params, element, text });
    try {
      await navigator.clipboard.writeText(value);
      setFailed(false);
      setNotice(thenOpen ? "Prompt copied · opening Claude Desktop" : "Prompt copied: paste it in Claude Code, opened on this project");
      setTimeout(() => setNotice(null), 4000);
      if (thenOpen) window.location.href = `claude://code/new?q=${encodeURIComponent(value)}`;
    } catch {
      setFailed(true);
      setNotice("Copy failed: select the prompt and copy it");
      preview.current?.focus();
      preview.current?.select();
    }
  };

  const fieldCls = "w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-xs text-white";
  return (
    <div className="grid gap-3" data-lab-explore>
      <label className="grid gap-1 text-[11px] text-neutral-400">
        What do you want to try?
        <textarea
          ref={field}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="In your own words: a layout, a density, another option, more data…"
          className={fieldCls}
        />
      </label>
      {!text && (
        <div className="grid gap-1" data-lab-examples>
          <p className="text-[11px] uppercase tracking-wide text-neutral-400">For example</p>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setText(ex)} className="rounded px-2 py-1 text-left text-xs text-neutral-300 hover:bg-neutral-800/60">
              “{ex}”
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-1 text-xs">
        {element && (
          <p className="rounded bg-neutral-800 px-2 py-1" data-lab-designated>
            <code>&lt;{element.tag}&gt;</code> {element.text && `“${element.text}”`}
            <span className="block truncate text-[11px] text-neutral-400" title={element.path}>
              {element.path}
            </span>
          </p>
        )}
        {compared ? (
          <p className="text-[11px] text-neutral-400">Open a cell to point at an element</p>
        ) : designating ? (
          <p className="text-[11px] text-amber-400">Click an element in the prototype · Esc to cancel</p>
        ) : (
          <button type="button" onClick={() => setDesignating(true)} className="min-h-6 justify-self-start text-[11px] text-neutral-300 underline-offset-2 hover:text-white hover:underline">
            {element ? "Point at another element" : "Point at an element (optional)"}
          </button>
        )}
      </div>
      {ready && <textarea ref={preview} readOnly value={prompt} rows={5} aria-label="Prompt" className={`${fieldCls} font-mono text-[11px] text-neutral-300`} data-lab-prompt />}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!ready} onClick={() => copy(false)} className="rounded-md bg-white px-2 py-1 text-xs text-black disabled:opacity-40">
          Copy prompt
        </button>
        <button type="button" disabled={!ready} onClick={() => copy(true)} className="rounded-md border border-neutral-600 px-2 py-1 text-xs disabled:opacity-40">
          Open in Claude Desktop
        </button>
        {(text || element) && (
          <button
            type="button"
            onClick={() => {
              setText("");
              setElement(null);
              setNotice(null);
            }}
            className="min-h-6 text-[11px] text-neutral-300 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>
      <p className={`text-[11px] ${failed ? "text-amber-400" : "text-neutral-400"}`} aria-live="polite">
        {notice}
      </p>
      <p className="text-[11px] leading-relaxed text-neutral-400">
        Claude Code writes the change with the Protolab skills, then gives you the link to compare. The lab never changes the code.
      </p>
    </div>
  );
}

function composePrompt(input: {
  proto: { slug: string; name: string };
  basePath: string;
  axes: Axis[];
  screens: Screen[];
  scenarios: Scenario[];
  params: URLSearchParams;
  element: Designated | null;
  text: string;
}) {
  const { proto, basePath, axes, screens, scenarios, params, element, text } = input;
  const screen = screens.find((s) => s.key === screenValue(screens, params));
  const size = viewportValue(params);
  const state = [
    screen ? `screen: ${screen.label} (${screen.key})${screen.steps?.length ? ` step ${stepValue(screen, params)}/${screen.steps.length}` : ""}` : "screen: (single screen)",
    ...axes.map((a) => {
      const v = a.values.find((x) => x.id === axisValue(a, params));
      return `axis ${a.key}: ${v?.label} (${v?.id})${a.kind === "structural" ? ", structural" : ""}; values ${a.values.map((x) => x.id).join(", ")}`;
    }),
    ...scenarios.map((s) => {
      const v = s.values.find((x) => x.id === scenarioValue(s, params));
      return `scenario ${s.key}: ${v?.label} (${v?.id}); values ${s.values.map((x) => x.id).join(", ")}`;
    }),
    size ? `viewport: ${size.width}x${size.height}` : "viewport: free size",
  ].join("\n  ");
  const href = typeof window === "undefined" ? "" : window.location.href;
  const base = `${basePath}/p/${proto.slug}`;
  return [
    "Protolab request",
    "",
    `Proto: ${proto.name} (slug "${proto.slug}"). Read protolab.config.json at the project root first: it declares the manifest file and the protos folder. This proto is the manifest entry with slug "${proto.slug}"; its files are in "<protos folder>/${proto.slug}/".`,
    `State: ${href}`,
    `  ${state}`,
    ...(element
      ? [`Element: <${element.tag}>${element.text ? ` "${element.text}"` : ""}`, `  path: ${element.path}`, ...(element.attributes ? [`  attributes: ${element.attributes}`] : [])]
      : []),
    `Request: ${text.trim()}`,
    "",
    "Apply this request in this project with the Protolab skills (in .claude/skills/; run `npx protolab-skills` if they are missing).",
    "- First decide what it is, and say which: a new value of an existing axis; a new state axis (a mode: empty, compact, a wording); a structural axis (competing versions of a block or of the layout); several approaches of the screen (`/protolab diverge`); a scenario (the data: volumes, roles, personas; `/protolab scenarios`); screens or steps.",
    "- Change only this proto: its files and its manifest entry. Keep its existing axes, values and ids.",
    "- Reuse the host's components without restyling them; do not edit the design system or the engine.",
    ...(element ? ["- The element was rendered in the state above: a block that comes from a structural axis lives in the component of that axis's current value."] : []),
    "- Keep the link above valid: this state must still render after the change.",
    `- Run \`npx protolab-check\`, then give the links to compare: ${base}?compare=<axis key>&v=1280x800 and ${base}?compare=<axis key>&v=390x844.`,
  ].join("\n");
}
