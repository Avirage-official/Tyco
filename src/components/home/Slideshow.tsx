"use client";

import { useEffect, useState } from "react";
import type { AboutSlide } from "@/lib/supabase/types";
import styles from "./Slideshow.module.css";

const INTERVAL_MS = 5000;

export function Slideshow({ slides }: { slides: AboutSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <section className={styles.wrap} aria-label="Who we are">
      {slides.map((slide, i) => (
        <div key={slide.url} className={styles.slide} data-active={i === index}>
          {slide.type === "video" ? (
            <video className={styles.media} src={slide.url} muted loop autoPlay playsInline />
          ) : (
            <div className={styles.media} style={{ backgroundImage: `url(${slide.url})` }} />
          )}
        </div>
      ))}

      {slides.length > 1 && (
        <div className={styles.dots}>
          {slides.map((slide, i) => (
            <button
              key={slide.url}
              type="button"
              className={styles.dot}
              data-active={i === index}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
