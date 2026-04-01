import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright uses 127.0.0.1 while Next dev may report localhost; avoids cross-origin dev warnings.
  allowedDevOrigins: ["http://127.0.0.1:3000"],
};

export default nextConfig;
