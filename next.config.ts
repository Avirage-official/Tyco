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
  async redirects() {
    // Routes renamed in the UI pass (docs/design-system.md §11). Permanent
    // so shared links and search results move over.
    return [{ source: "/studio/deals", destination: "/deals", permanent: true }];
  },
};

export default nextConfig;
