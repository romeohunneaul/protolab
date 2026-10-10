import Link from "next/link";
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
      <ul className="grid gap-3">
        {protos.map((p) => (
          <li key={p.slug}>
            <Link href={`${basePath}/p/${p.slug}`} className="block rounded-lg border p-4 hover:bg-black/[0.02]">
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="font-semibold">{p.name}</span>
                <span className="font-mono text-sm text-neutral-400">{p.slug}</span>
              </div>
              <p className="text-sm text-neutral-600">{p.description}</p>
              {p.axes?.length || p.screens?.length ? (
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {p.screens?.length ? (
                    <span className="rounded-full border px-2 py-0.5 text-xs text-neutral-600">
                      {`Screens ×${p.screens.length}`}
                    </span>
                  ) : null}
                  {(p.axes ?? []).map((a) => (
                    <span key={a.key} className="rounded-full border px-2 py-0.5 text-xs text-neutral-600">
                      {`${a.label} ×${a.values.length}`}
                    </span>
                  ))}
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
