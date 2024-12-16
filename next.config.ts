import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    BROWSER_VNC_URL: process.env.BROWSER_VNC_URL,
    LAMBDA_FUNCTION_URL: process.env.LAMBDA_FUNCTION_URL,
    IMAGE_HOST: process.env.IMAGE_HOST,
    BACKEND_URL: process.env.BACKEND_URL,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.IMAGE_HOST || "",
        pathname: "/**",
        port: "",
      },
    ],
  },
};

export default nextConfig;
