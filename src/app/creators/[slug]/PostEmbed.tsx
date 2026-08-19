"use client";

import { useEffect } from "react";
import { detectPostEmbedPlatform } from "@/lib/embeds";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

/** Renders a real Instagram post/reel or TikTok video embed for a work's link. */
export function PostEmbed({ url, className }: { url: string; className?: string }) {
  const platform = detectPostEmbedPlatform(url);

  useEffect(() => {
    if (platform === "instagram") {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
      return;
    }

    if (platform === "tiktok") {
      // TikTok's embed.js scans the DOM for `.tiktok-embed` blockquotes on
      // load and isn't idempotent-guarded like Instagram's — a fresh script
      // tag per mount is what reliably reprocesses a newly-rendered embed.
      const script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        script.remove();
      };
    }
  }, [platform, url]);

  if (platform === "instagram") {
    return (
      <div className={className}>
        <blockquote className="instagram-media" data-instgrm-permalink={url} data-instgrm-version="14" />
      </div>
    );
  }

  if (platform === "tiktok") {
    return (
      <div className={className}>
        <blockquote className="tiktok-embed" cite={url}>
          <section />
        </blockquote>
      </div>
    );
  }

  return null;
}
