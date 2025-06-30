import type { NextConfig } from "next";

const nextConfig = {
  images: {
    domains: ["4gljd3mv5c.ufs.sh"],
  },
  webpack: (config: any) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

module.exports = nextConfig;
