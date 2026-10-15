import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findProto } from "@romeohunneaul/protolab";
import { PROTOS } from "@/lab/manifest";
import LabProto from "./proto";

export const metadata: Metadata = { title: "Lab", robots: { index: false, follow: false } };
export const generateStaticParams = () => PROTOS.map((p) => ({ slug: p.slug }));

// The server page checks the slug; the client module next to it imports the manifest and renders
// the proto, so the loaders (components, scenario data) never cross the server boundary.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!findProto(PROTOS, slug)) notFound();
  return <LabProto slug={slug} />;
}
