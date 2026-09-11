"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { LinkButton } from "@/components/ui/Button";
import { IconArrowRight } from "@/components/icons";
import { MotionLink } from "@/lib/motion/MotionLink";
import { fadeUpContainer, fadeUpItem, revealViewport } from "@/lib/motion/variants";
import { formatDate } from "@/lib/format";
import styles from "./JournalStrip.module.css";

export type ReleasePreview = {
  id: string;
  title: string;
  cover_url: string | null;
  source_channel: string | null;
  release_date: string | null;
  published_at: string | null;
};

function ReleaseCard({ release }: { release: ReleasePreview }) {
  return (
    <MotionLink href="/journal" className={styles.card} variants={fadeUpItem}>
      <span className={styles.cover} aria-hidden>
        {release.cover_url && (
          <span className={styles.coverImg} style={{ backgroundImage: `url(${release.cover_url})` }} />
        )}
        <span className={styles.scrim} />
        <span className={styles.playIcon} />
      </span>
      <span className={styles.body}>
        <span className={styles.title}>{release.title}</span>
        <span className={styles.meta}>
          {[release.source_channel, formatDate(release.release_date ?? release.published_at)]
            .filter(Boolean)
            .join(" — ")}
        </span>
      </span>
    </MotionLink>
  );
}

export function JournalStrip({ releases }: { releases: ReleasePreview[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  if (releases.length === 0) return null;

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(`.${styles.card}`);
    const amount = (card?.offsetWidth ?? 260) + 16;
    track.scrollBy({ left: amount * direction, behavior: "smooth" });
  }

  return (
    <section className={`container ${styles.wrap}`} aria-label="Journal">
      <div className={styles.head}>
        <div>
          <p className="eyebrow">The Journal</p>
          <h2 className={styles.heading}>New from the scene</h2>
        </div>
        <LinkButton href="/journal" variant="ghost" className={styles.headCta}>
          See the Journal
        </LinkButton>
      </div>

      <div className={styles.row}>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowLeft}`}
          onClick={() => scrollByCard(-1)}
          aria-label="Scroll to previous releases"
        >
          <IconArrowRight />
        </button>

        <motion.div
          ref={trackRef}
          className={styles.track}
          variants={fadeUpContainer}
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
        >
          {releases.map((release) => (
            <ReleaseCard key={release.id} release={release} />
          ))}
        </motion.div>

        <button
          type="button"
          className={styles.arrow}
          onClick={() => scrollByCard(1)}
          aria-label="Scroll to next releases"
        >
          <IconArrowRight />
        </button>
      </div>
    </section>
  );
}
