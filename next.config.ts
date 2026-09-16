import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Content images come from Supabase Storage (covers, products, the
    // about-page slideshow) and YouTube thumbnails for Journal releases.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
};

export default nextConfig;
