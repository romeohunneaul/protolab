import Link from "next/link";
import type { ReactNode } from "react";
import type { Proto } from "./manifest";
import { CHROME } from "./chrome";

export type LabDashboardProps = {
  protos: Proto[];
  /** Route prefix of the proto pages. Default `/lab`. */
  basePath?: string;
  title?: string;
  subtitle?: string;
};

/**
 * The lab index: one row per proto, in the lab panel's look and over the host's layout, so the index
 * never reads as one of the protos. Server component; plain Tailwind utilities.
 */
export function LabDashboard({
  protos,
  basePath = "/lab",
  title = "Lab",
  subtitle = "Prototypes built on the project's real components. Not shipped.",
}: LabDashboardProps) {
  return (
    <main className={`fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[#1c1c1c] text-white ${CHROME}`}>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-base font-semibold">{title}</h1>
        <p className="mt-1 mb-6 text-xs text-neutral-400">{subtitle}</p>
        {protos.length === 0 && (
          <p className="text-xs text-neutral-400">
            No prototype yet. Run <code className="text-neutral-300">npx protolab-new &lt;slug&gt; &quot;&lt;Name&gt;&quot;</code> to create one.
          </p>
        )}
        <ul className="divide-y divide-neutral-800 border-y border-neutral-800 empty:hidden">
          {protos.map((p) => (
            <li key={p.slug}>
              <Link href={`${basePath}/p/${p.slug}`} className="block px-2 py-3 text-xs text-neutral-300 hover:bg-neutral-800/60">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-white">{p.name}</span>
                  <span className="font-mono text-[11px] text-neutral-400">{p.slug}</span>
                </span>
                <span className="mt-1 block">{p.description}</span>
                {p.axes?.length || (p.screens?.length ?? 0) > 1 || p.scenarios?.length || p.offDs ? (
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {(p.screens?.length ?? 0) > 1 ? <Chip>{`Screens ×${p.screens!.length}`}</Chip> : null}
                    {(p.axes ?? []).map((a) => (
                      <Chip key={`a.${a.key}`}>{`${a.label} ×${a.values.length}`}</Chip>
                    ))}
                    {(p.scenarios ?? []).map((s) => (
                      <Chip key={`s.${s.key}`}>{`${s.label} ×${s.values.length}`}</Chip>
                    ))}
                    {p.offDs ? <Chip tone="amber">Off design system</Chip> : null}
                  </span>
                ) : null}
                <span className="mt-2 block text-[11px] text-neutral-400">{p.author}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function Chip({ children, tone }: { children: ReactNode; tone?: "amber" }) {
  const color = tone === "amber" ? "border-amber-400/60 text-amber-400" : "border-neutral-700 text-neutral-300";
  return <span className={`rounded border px-1.5 py-0.5 text-[11px] ${color}`}>{children}</span>;
}
