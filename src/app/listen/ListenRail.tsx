"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconArrowRight } from "@/components/icons";
import { EASE_IN_OUT } from "@/lib/motion/variants";
import { ListenTile } from "./ListenTile";
import type { Release } from "./types";
import styles from "./listen.module.css";

const SIZES = "(min-width: 1200px) 26rem, (min-width: 860px) 42vw, 78vw";

/**
 * A horizontal rail of square tiles, scrolled with native CSS scroll-snap
 * rather than a carousel package: drag, swipe, trackpad, keyboard and the
 * scrollbar all work because the browser is doing the scrolling. The
 * arrows only nudge scrollLeft.
 */
export function ListenRail({ releases }: { releases: Release[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /** Which tile is nearest the middle of the track — it drives the backdrop. */
  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    setAtStart(track.scrollLeft <= 4);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);

    const middle = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const distance = Math.abs(el.offsetLeft + el.offsetWidth / 2 - middle);
      if (distance < best) {
        best = distance;
        nearest = i;
      }
    });
    setActive(nearest);
  }, []);

  useEffect(() => {
    sync();
    const onResize = () => sync();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [sync]);

  function nudge(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const first = track.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 24 : track.clientWidth * 0.8;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  const backdrop = releases[active]?.coverUrl ?? null;

  return (
    <div className={styles.stage}>
      {/* Blurred past recognition, a thumbnail stops being a thumbnail and
          becomes the room the tiles sit in — and it changes as you scroll. */}
      <div className={styles.backdrop} aria-hidden>
        <AnimatePresence mode="wait" initial={false}>
          {backdrop && (
            <motion.div
              key={backdrop}
              className={styles.backdropImage}
              style={{ backgroundImage: `url(${backdrop})` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE_IN_OUT }}
            />
          )}
        </AnimatePresence>
        <span className={styles.backdropScrim} />
      </div>

      <div
        ref={trackRef}
        className={styles.track}
        onScroll={sync}
        tabIndex={0}
        role="region"
        aria-label="Releases"
      >
        {releases.map((release) => (
          <ListenTile key={release.id} release={release} sizes={SIZES} />
        ))}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => nudge(-1)}
          disabled={atStart}
          aria-label="Previous releases"
        >
          <IconArrowRight aria-hidden />
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowNext}`}
          onClick={() => nudge(1)}
          disabled={atEnd}
          aria-label="More releases"
        >
          <IconArrowRight aria-hidden />
        </button>
      </div>
    </div>
  );
}
