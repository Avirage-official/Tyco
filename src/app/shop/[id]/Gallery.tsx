"use client";

import { useRef, useState } from "react";
import { IconArrowRight } from "@/components/icons";
import styles from "./Gallery.module.css";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  }

  if (images.length === 0) {
    return <div className={styles.frame} />;
  }

  return (
    <div className={styles.frame}>
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
            onClick={() => scrollToIndex(active - 1)}
            aria-label="Previous photo"
            disabled={active === 0}
          >
            <IconArrowRight />
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowNext}`}
            onClick={() => scrollToIndex(active + 1)}
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
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
