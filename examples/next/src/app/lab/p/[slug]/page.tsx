import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { ProtoView, findProto } from "@romeohunneaul/protolab";
import { PROTOS } from "@/lab/manifest";

export const metadata: Metadata = { title: "Lab", robots: { index: false, follow: false } };
export const generateStaticParams = () => PROTOS.map((p) => ({ slug: p.slug }));

// dynamic() must run at module scope, not during render.
const COMPONENTS = Object.fromEntries(PROTOS.map((p) => [p.slug, dynamic(p.load)]));

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const proto = findProto(PROTOS, slug);
  if (!proto) notFound();
  return <ProtoView proto={proto} Component={COMPONENTS[slug]} />;
}
