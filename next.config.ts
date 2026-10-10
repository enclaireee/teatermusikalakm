import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // 3 MB payment proof + multipart overhead goes through the submitPayment action.
    serverActions: { bodySizeLimit: "4mb" },
  },
  async redirects() {
    return [{ source: "/about", destination: "/#tentang", permanent: false }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
