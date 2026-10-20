"use client";

import { useAxis, useScenario, useScreen } from "@romeohunneaul/protolab";
import type { Invoice } from "./data";

// The other value of the structural axis "layout": the same data, as cards.
export default function ListCards() {
  const { go } = useScreen();
  const density = useAxis("density");
  const { data, loading } = useScenario<Invoice[]>("volume");
  const pad = density === "compact" ? "p-2" : "p-4";

  if (loading) return <p className="text-sm text-neutral-400">Loading invoices…</p>;
  if (!data?.length) return <p className="text-sm text-neutral-500">No invoice yet.</p>;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {data.map((invoice) => (
        <li key={invoice.id}>
          <button type="button" onClick={() => go("detail")} className={`block w-full rounded-lg border text-left text-sm hover:bg-black/[0.02] ${pad}`}>
            <span className="block font-medium">Invoice {invoice.id}</span>
            <span className="block text-neutral-500">{invoice.customer}</span>
            <span className="block tabular-nums">{invoice.amount} €</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
