import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark packages that rely on Node.js native modules as external
  // so they are not bundled into the serverless function
  serverExternalPackages: ["mammoth"],
};

export default nextConfig;
