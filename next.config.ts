import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark packages that rely on Node.js native modules as external
  // so they are not bundled into the serverless function
  //
  // @google/genai opens its Gemini Live socket through `ws`; bundling it breaks
  // the WebSocket at runtime, which surfaces as speech silently returning
  // nothing. External, it loads `ws` as a plain Node require.
  serverExternalPackages: ["mammoth", "@node-rs/argon2", "@google/genai"],
};

export default nextConfig;
