import type { Metadata } from "next";
import { LabDashboard } from "@romeohunneaul/protolab";
import { PROTOS } from "@/lab/manifest";

export const metadata: Metadata = { title: "Lab", robots: { index: false, follow: false } };

export default function LabPage() {
  return <LabDashboard protos={PROTOS} subtitle="The protolab example app. Add a proto with `npm run lab:new`." />;
}
