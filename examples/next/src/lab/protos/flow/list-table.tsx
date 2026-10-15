"use client";

import { useAxis, useScenario, useScreen } from "@romeohunneaul/protolab";
import type { Invoice } from "./data";

// One value of the structural axis "layout". It reads the other axes, the screen and the
// scenarios like the proto itself, and receives no prop.
export default function ListTable() {
  const { go } = useScreen();
  const density = useAxis("density");
  const { data, loading } = useScenario<Invoice[]>("volume");
  const row = density === "compact" ? "py-1" : "py-3";

  if (loading) return <p className="text-sm text-neutral-400">Loading invoices…</p>;
  if (!data?.length) return <p className="text-sm text-neutral-500">No invoice yet.</p>;
  return (
    <ul className="divide-y rounded-lg border">
      {data.map((invoice) => (
        <li key={invoice.id}>
          <button type="button" onClick={() => go("detail")} className={`flex w-full justify-between px-4 text-left text-sm hover:bg-black/[0.02] ${row}`}>
            <span>Invoice {invoice.id}</span>
            <span className="text-neutral-500">{invoice.customer}</span>
            <span className="tabular-nums">{invoice.amount} €</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
