"use client";

import { useEffect } from "react";

// Designating an element: the user clicks an element of the proto's render (never a lab tool) and
// the lab names it so a session can find it in the code. Works in the page and, through the frame
// bridge below, inside the viewport frame (the same proto as a clean page, ADR 0007).

export type Designated = { tag: string; text: string; path: string; attributes: string };

const USEFUL = (name: string) => ["id", "role", "href", "name", "type", "for", "alt", "title"].includes(name) || name.startsWith("aria-") || (name.startsWith("data-") && !name.startsWith("data-lab"));

/** Tag, visible text (80 chars), path of tags and ranks up to the proto's root, useful attributes. */
export function describeElement(el: Element, root: Element | null): Designated {
  const path: string[] = [];
  for (let node: Element | null = el; node && node !== root && node.tagName !== "BODY" && node.tagName !== "HTML"; node = node.parentElement) {
    const tag = node.tagName.toLowerCase();
    const parent = node.parentElement;
    const alike = parent ? Array.from(parent.children).filter((c) => c.tagName === node!.tagName) : [node];
    path.unshift(alike.length > 1 ? `${tag}:nth-of-type(${alike.indexOf(node) + 1})` : tag);
  }
  return {
    tag: el.tagName.toLowerCase(),
    text: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
    path: path.join(" > "),
    attributes: Array.from(el.attributes)
      .filter((a) => USEFUL(a.name))
      .map((a) => `${a.name}="${a.value}"`)
      .join(" "),
  };
}

/**
 * While active: the element under the pointer is outlined; a click in the proto's render designates
 * it instead of triggering it; Escape, or a click in the lab panel, cancels.
 */
export function useDesignation(active: boolean, onPick: (d: Designated) => void, onCancel: () => void, root: () => Element | null) {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    let hovered: HTMLElement | null = null;
    let outline = "";
    const inLab = (el: Element) => !!el.closest("[data-lab-ui]");
    const clear = () => {
      if (hovered) hovered.style.outline = outline;
      hovered = null;
    };
    const over = (e: MouseEvent) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || inLab(el)) return clear();
      if (el === hovered) return;
      clear();
      hovered = el;
      outline = el.style.outline;
      el.style.outline = "2px solid #f59e0b";
    };
    const click = (e: MouseEvent) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      if (inLab(el)) return onCancel();
      e.preventDefault();
      e.stopPropagation();
      clear();
      onPick(describeElement(el, root()));
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clear();
        onCancel();
      }
    };
    document.addEventListener("mouseover", over, true);
    document.addEventListener("click", click, true);
    document.addEventListener("keydown", key, true);
    document.body.style.cursor = "crosshair";
    return () => {
      clear();
      document.body.style.cursor = "";
      document.removeEventListener("mouseover", over, true);
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", key, true);
    };
  }, [active, onPick, onCancel, root]);
}

// The bridge between the lab page and a frame: the lab asks the frame to designate, the frame
// answers with the element or a cancel. Same-origin messages only.
export const DESIGNATE = "protolab:designate";
export const DESIGNATING = "protolab:designating";
export const DESIGNATED = "protolab:designated";
export const DESIGNATION_CANCELLED = "protolab:designation-cancelled";

export const sameOrigin = (event: MessageEvent) => typeof window !== "undefined" && event.origin === window.location.origin;
