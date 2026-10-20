"use client";

import { AxisSlot, useScreen } from "@romeohunneaul/protolab";

// Three screens: the list (its layout is a structural axis, rendered by <AxisSlot />), the detail,
// and a checkout in three steps. Every move is a URL: reload or share it, you land there.
export default function Flow() {
  const { screen, go, step, steps, next, prev } = useScreen();

  if (screen === "detail") {
    return (
      <section className="py-8">
        <button type="button" onClick={() => go("list")} className="mb-4 text-sm text-neutral-500 hover:underline">
          ← Back to the list
        </button>
        <h1 className="mb-1 text-2xl font-semibold">Invoice #1042</h1>
        <p className="mb-4 text-sm text-neutral-700">The detail screen has its own URL (?screen=detail): reload or share it, you land here.</p>
        <button type="button" onClick={() => go("checkout")} className="rounded-md bg-black px-3 py-1.5 text-sm text-white">
          Pay
        </button>
      </section>
    );
  }

  if (screen === "checkout") {
    return (
      <section className="py-8">
        <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
          Step {step} of {steps.length}
        </p>
        <h1 className="mb-4 text-2xl font-semibold">{steps[step - 1]}</h1>
        <p className="mb-6 text-sm text-neutral-700">Each step has its own URL (?screen=checkout&step={step}). Back walks the steps.</p>
        <div className="flex gap-2">
          <button type="button" onClick={prev} disabled={step === 1} className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-40">
            Back
          </button>
          {step < steps.length ? (
            <button type="button" onClick={next} className="rounded-md bg-black px-3 py-1.5 text-sm text-white">
              Continue
            </button>
          ) : (
            <button type="button" onClick={() => go("list")} className="rounded-md bg-black px-3 py-1.5 text-sm text-white">
              Done
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <h1 className="mb-4 text-2xl font-semibold">Invoices</h1>
      <AxisSlot axis="layout" />
    </section>
  );
}
