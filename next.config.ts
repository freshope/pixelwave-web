import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      // 기존 CF Pages 시절의 /<slug>.html URL 호환.
      {
        source: "/:slug(privacy|terms|account-deletion).html",
        destination: "/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
