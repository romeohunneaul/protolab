"use client";

import { ProtoView, findProto } from "@romeohunneaul/protolab";
import { PROTOS } from "@/lab/manifest";

export default function LabProto({ slug }: { slug: string }) {
  const proto = findProto(PROTOS, slug);
  if (!proto) return null;
  return <ProtoView proto={proto} protos={PROTOS} basePath="/lab" />;
}
