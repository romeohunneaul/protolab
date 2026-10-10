"use client";

import { useAxis, useScreen } from "@romeohunneaul/protolab";

const ITEMS = ["Invoice #1042", "Invoice #1043", "Invoice #1044"];

export default function Flow() {
  const { screen, go } = useScreen();
  const density = useAxis("density");
  const row = density === "compact" ? "py-1" : "py-3";

  if (screen === "detail") {
    return (
      <section className="py-8">
        <button type="button" onClick={() => go("list")} className="mb-4 text-sm text-neutral-500 hover:underline">
          ← Back to the list
        </button>
        <h1 className="mb-1 text-2xl font-semibold">{ITEMS[0]}</h1>
        <p className="text-sm text-neutral-700">The detail screen has its own URL (?screen=detail): reload or share it, you land here.</p>
      </section>
    );
  }
  return (
    <section className="py-8">
      <h1 className="mb-4 text-2xl font-semibold">Invoices</h1>
      <ul className="divide-y rounded-lg border">
        {ITEMS.map((item) => (
          <li key={item}>
            <button type="button" onClick={() => go("detail")} className={`block w-full px-4 text-left text-sm hover:bg-black/[0.02] ${row}`}>
              {item}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
