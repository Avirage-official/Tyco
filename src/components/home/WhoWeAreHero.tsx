"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowRight } from "@/components/icons";
import type { AboutSlide } from "@/lib/supabase/types";
import styles from "./WhoWeAreHero.module.css";

const INTERVAL_MS = 5000;

export function WhoWeAreHero({ slides }: { slides: AboutSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, [slides.length, paused]);

  return (
    <section
      className={styles.hero}
      data-paused={paused}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={styles.mediaStack} aria-hidden={slides.length === 0}>
        {slides.map((slide, i) =>
          slide.type === "video" ? (
            <video
              key={slide.url}
              className={styles.media}
              data-active={i === index}
              src={slide.url}
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <div
              key={slide.url}
              className={styles.media}
              data-active={i === index}
              style={{ backgroundImage: `url(${slide.url})` }}
            />
          )
        )}
        <span className={styles.scrim} aria-hidden />
      </div>

      <div className={`container ${styles.frame}`}>
        <p className={styles.blurb}>
          TYCO is a Southeast Asia-rooted creative collective — part
          community, part commerce. We put out apparel that carries the
          culture, back the creators building it, and we&apos;re opening up
          real access to the studios, bars, and lessons creatives already
          spend on.
        </p>

        <div className={styles.bottom}>
          <div className={styles.left}>
            {slides.length > 1 && (
              <div className={styles.tabs} role="tablist" aria-label="Gallery">
                {slides.map((slide, i) => (
                  <button
                    key={slide.url}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    className={styles.tab}
                    data-active={i === index}
                    onClick={() => setIndex(i)}
                  >
                    <span className={styles.tabNum}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.tabTrack}>
                      {i === index && <span key={index} className={styles.tabFill} />}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className={styles.copy}>
              <p className="eyebrow">Who we are</p>
              <h2 className={styles.title}>
                An artistic collective, not a <em>label</em> with a merch table.
              </h2>
            </div>
          </div>

          <Link href="/about" className={styles.cta}>
            <span className={styles.ctaLabel}>Read our full story</span>
            <IconArrowRight className={styles.ctaIcon} />
          </Link>
        </div>
      </div>
    </section>
  );
}
