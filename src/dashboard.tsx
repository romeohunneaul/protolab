import Link from "next/link";
import type { ReactNode } from "react";
import type { Proto } from "./manifest";

export type LabDashboardProps = {
  protos: Proto[];
  /** Route prefix of the proto pages. Default `/lab`. */
  basePath?: string;
  title?: string;
  subtitle?: string;
};

/**
 * The lab index: one card per proto. Server component, no styling dependency on the host:
 * plain Tailwind utilities. Override by wrapping, not by forking.
 */
export function LabDashboard({
  protos,
  basePath = "/lab",
  title = "Lab",
  subtitle = "Prototypes built on the project's real components. Not shipped.",
}: LabDashboardProps) {
  return (
    <main className="py-8">
      <h1 className="mb-1 text-2xl font-semibold">{title}</h1>
      <p className="mb-8 text-sm text-neutral-500">{subtitle}</p>
      {protos.length === 0 && (
        <p className="text-sm text-neutral-500">
          No prototype yet. Run <code>npx protolab-new &lt;slug&gt; &quot;&lt;Name&gt;&quot;</code> to create one.
        </p>
      )}
      <ul className="grid gap-3">
        {protos.map((p) => (
          <li key={p.slug}>
            <Link href={`${basePath}/p/${p.slug}`} className="block rounded-lg border p-4 hover:bg-black/[0.02]">
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="font-semibold">{p.name}</span>
                <span className="font-mono text-sm text-neutral-400">{p.slug}</span>
              </div>
              <p className="text-sm text-neutral-600">{p.description}</p>
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
              <p className="mt-1 text-sm text-neutral-400">{p.author}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

function Chip({ children, tone }: { children: ReactNode; tone?: "amber" }) {
  const color = tone === "amber" ? "border-amber-400 text-amber-700" : "text-neutral-600";
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${color}`}>{children}</span>;
}
