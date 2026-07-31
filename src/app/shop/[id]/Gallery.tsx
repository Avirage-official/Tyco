"use client";

import { useEffect, useRef, useState } from "react";
import { IconArrowRight } from "@/components/icons";
import styles from "./Gallery.module.css";

const AUTOPLAY_MS = 4500;

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stoppedRef = useRef(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: active * track.clientWidth, behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    if (images.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      if (stoppedRef.current) return;
      setActive((prev) => (prev + 1) % images.length);
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [images.length]);

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  }

  function stopAutoplay() {
    stoppedRef.current = true;
  }

  if (images.length === 0) {
    return <div className={styles.frame} />;
  }

  return (
    <div className={styles.frame} onPointerDown={stopAutoplay}>
      <div className={styles.track} ref={trackRef} onScroll={handleScroll}>
        {images.map((url, i) => (
          <div
            key={url}
            className={styles.slide}
            style={{ backgroundImage: `url(${url})` }}
            role="img"
            aria-label={`${alt} — photo ${i + 1} of ${images.length}`}
          />
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowPrev}`}
            onClick={() => {
              stopAutoplay();
              setActive((a) => Math.max(0, a - 1));
            }}
            aria-label="Previous photo"
            disabled={active === 0}
          >
            <IconArrowRight />
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowNext}`}
            onClick={() => {
              stopAutoplay();
              setActive((a) => Math.min(images.length - 1, a + 1));
            }}
            aria-label="Next photo"
            disabled={active === images.length - 1}
          >
            <IconArrowRight />
          </button>

          <div className={styles.dots}>
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                className={i === active ? `${styles.dot} ${styles.dotActive}` : styles.dot}
                onClick={() => {
                  stopAutoplay();
                  setActive(i);
                }}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
