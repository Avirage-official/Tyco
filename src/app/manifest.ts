import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tyco",
    short_name: "Tyco",
    description:
      "Free music, the studio journal, and the shop — Tyco as an app on your phone.",
    start_url: "/",
    display: "standalone",
    background_color: "#100e0d",
    theme_color: "#100e0d",
    icons: [
      { src: "/web-icon-192", sizes: "192x192", type: "image/png" },
      { src: "/web-icon-512", sizes: "512x512", type: "image/png" },
      { src: "/web-icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
