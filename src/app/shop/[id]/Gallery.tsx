"use client";

import { useState } from "react";
import { IconArrowRight } from "@/components/icons";
import styles from "./Gallery.module.css";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className={styles.layout}>
        <div className={styles.frame} />
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {images.length > 1 && (
        <div className={styles.thumbs}>
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              className={i === active ? `${styles.thumb} ${styles.thumbActive}` : styles.thumb}
              style={{ backgroundImage: `url(${url})` }}
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === active}
            />
          ))}
        </div>
      )}

      <div className={styles.frame}>
        <div
          className={styles.mainImage}
          style={{ backgroundImage: `url(${images[active]})` }}
          role="img"
          aria-label={`${alt} — photo ${active + 1} of ${images.length}`}
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowPrev}`}
              onClick={() => setActive((a) => Math.max(0, a - 1))}
              aria-label="Previous photo"
              disabled={active === 0}
            >
              <IconArrowRight />
            </button>
            <button
              type="button"
              className={styles.arrow}
              onClick={() => setActive((a) => Math.min(images.length - 1, a + 1))}
              aria-label="Next photo"
              disabled={active === images.length - 1}
            >
              <IconArrowRight />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
