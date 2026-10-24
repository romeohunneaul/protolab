"use client";

import { ProtoView, findProto } from "@romeohunneaul/protolab";
import { PROTOS } from "@/lab/manifest";

export default function LabProto({ slug }: { slug: string }) {
  const proto = findProto(PROTOS, slug);
  if (!proto) return null;
  // `explore` is on here so the smoke tests, run on the production build, cover it.
  return <ProtoView proto={proto} protos={PROTOS} basePath="/lab" explore />;
}
