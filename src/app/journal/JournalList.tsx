"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { fadeUpContainer, fadeUpItem, revealViewport } from "@/lib/motion/variants";
import { formatDate } from "@/lib/format";
import { extractYouTubeId } from "@/lib/feed/youtube-embed";
import { IconArrowRight } from "@/components/icons";
import styles from "./journal.module.css";

export type JournalEntry = {
  id: string;
  kind: "release" | "news" | "event" | "product";
  title: string;
  description: string | null;
  coverUrl: string | null;
  date: string;
  href: string | null;
  meta: string | null;
};

const KIND_LABEL: Record<JournalEntry["kind"], string> = {
  release: "New release",
  news: "News",
  event: "Happening",
  product: "Shop",
};

function MediaEntry({ entry }: { entry: JournalEntry }) {
  const [playing, setPlaying] = useState(false);
  const videoId = extractYouTubeId(entry.href);

  return (
    <div className={styles.card}>
      <div className={styles.cover}>
        {playing && videoId ? (
          <iframe
            className={styles.embed}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
            title={entry.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {entry.coverUrl && (
              <div className={styles.coverImg} style={{ backgroundImage: `url(${entry.coverUrl})` }} aria-hidden />
            )}
            {videoId ? (
              <button
                type="button"
                className={styles.playBtn}
                aria-label={`Play ${entry.title}`}
                onClick={() => setPlaying(true)}
              >
                <span className={styles.playIcon} aria-hidden />
              </button>
            ) : entry.href ? (
              <a
                href={entry.href}
                target="_blank"
                rel="noreferrer"
                className={styles.playBtn}
                aria-label={`Open ${entry.title}`}
              >
                <IconArrowRight className={styles.playIcon} />
              </a>
            ) : null}
          </>
        )}
        <span className={styles.kindBadge}>{KIND_LABEL[entry.kind]}</span>
      </div>
      <div className={styles.body}>
        <p className={styles.title}>{entry.title}</p>
        <p className={styles.meta}>{[entry.meta, formatDate(entry.date)].filter(Boolean).join(" — ")}</p>
        {entry.description && <p className={styles.desc}>{entry.description}</p>}
      </div>
    </div>
  );
}

function PosterEntry({ entry }: { entry: JournalEntry }) {
  return (
    <Link href={entry.href ?? "#"} className={styles.posterCard}>
      {entry.coverUrl && (
        <div className={styles.posterImg} style={{ backgroundImage: `url(${entry.coverUrl})` }} aria-hidden />
      )}
      <div className={styles.posterScrim} aria-hidden />
      <span className={styles.kindBadge}>{KIND_LABEL[entry.kind]}</span>
      <div className={styles.posterBody}>
        <p className={styles.posterTitle}>{entry.title}</p>
        <p className={styles.posterMeta}>{formatDate(entry.date)}</p>
      </div>
    </Link>
  );
}

export function JournalList({ entries }: { entries: JournalEntry[] }) {
  return (
    <motion.ul
      className={styles.grid}
      variants={fadeUpContainer}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      {entries.map((entry) => (
        <motion.li key={entry.id} variants={fadeUpItem}>
          {entry.kind === "event" || entry.kind === "product" ? (
            <PosterEntry entry={entry} />
          ) : (
            <MediaEntry entry={entry} />
          )}
        </motion.li>
      ))}
    </motion.ul>
  );
}
