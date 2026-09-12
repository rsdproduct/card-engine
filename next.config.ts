import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the loopback IP the README recommends (http://127.0.0.1:PORT) to reach
  // dev-only assets/HMR. Next.js only permits `localhost` by default.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
