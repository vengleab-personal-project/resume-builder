import type { NextConfig } from "next";
import { SHARE_ROBOTS_HEADER } from "./src/shared/config/share";

const nextConfig: NextConfig = {
  // Mark packages that rely on Node.js native modules as external
  // so they are not bundled into the serverless function
  //
  // @google/genai opens its Gemini Live socket through `ws`; bundling it breaks
  // the WebSocket at runtime, which surfaces as speech silently returning
  // nothing. External, it loads `ws` as a plain Node require.
  serverExternalPackages: ["mammoth", "@node-rs/argon2", "@google/genai"],

  // Share links (/s/<code>): never indexed, cached or framed, and the URL - whose code
  // is the key to a CODE link - never leaks to another site through the Referer
  // header when the viewer clicks a link inside the CV.
  async headers() {
    return [
      {
        source: "/s/:path*",
        headers: [
          { key: "X-Robots-Tag", value: SHARE_ROBOTS_HEADER },
          { key: "Cache-Control", value: "private, no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
