import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    BROWSER_VNC_URL: process.env.BROWSER_VNC_URL,
    LAMBDA_FUNCTION_URL: process.env.LAMBDA_FUNCTION_URL,
  },
};

export default nextConfig;
