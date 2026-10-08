import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@romeohunneaul/protolab"],
  // The package is linked from two levels up (file:../..): let Turbopack see that root.
  turbopack: { root: join(import.meta.dirname, "../..") },
};
export default nextConfig;
