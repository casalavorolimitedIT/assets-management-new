import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qssyihfbcrrugoyinlyc.supabase.co",
      },
    ],
  },
};

export default nextConfig;
