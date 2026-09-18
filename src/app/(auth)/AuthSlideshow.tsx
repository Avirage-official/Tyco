"use client";

import { useEffect, useState } from "react";
import { CoverImage } from "@/components/ui/CoverImage";
import type { AboutSlide } from "@/lib/supabase/types";
import styles from "./AuthSlideshow.module.css";

const INTERVAL_MS = 5000;

/**
 * Half the frame on a desk. On a phone the frame is full-bleed and
 * portrait, so a landscape photograph is cropped from a source wider than
 * the viewport — asking for 100vw there upscales it visibly.
 */
const SIZES = "(min-width: 900px) 50vw, 175vw";

/**
 * The photographic side of the sign-in split. Crossfades the same gallery
 * the About section uses, on the same five-second rhythm, so the two read
 * as one piece of brand furniture.
 *
 * Decorative by design: the stack is aria-hidden and every image carries
 * an empty alt, because nothing here is information a signed-out visitor
 * needs in order to sign in.
 */
export function AuthSlideshow({ slides }: { slides: AboutSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className={styles.stack} aria-hidden>
      {slides.map((slide, i) =>
        slide.type === "video" ? (
          <div key={slide.url} className={styles.slide} data-active={i === index}>
            <video className={styles.video} src={slide.url} muted loop autoPlay playsInline />
          </div>
        ) : (
          <div key={slide.url} className={styles.slide} data-active={i === index}>
            <CoverImage src={slide.url} alt="" sizes={SIZES} priority={i === 0} />
          </div>
        )
      )}
    </div>
  );
}
