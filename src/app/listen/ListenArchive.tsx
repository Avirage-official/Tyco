"use client";

import { motion } from "motion/react";
import { fadeUpContainer, fadeUpItem, revealViewport } from "@/lib/motion/variants";
import { ListenTile } from "./ListenTile";
import type { Release } from "./types";
import styles from "./listen.module.css";

const SIZES = "(min-width: 900px) 20rem, 50vw";

/**
 * Everything the rail does not carry. The same tile, in a grid, so a
 * release from three months ago is findable without dragging the rail
 * across sixty items.
 */
export function ListenArchive({ releases }: { releases: Release[] }) {
  return (
    <section className={styles.archive}>
      <div className={`container ${styles.archiveInner}`}>
        <h2 className={styles.archiveTitle}>Earlier</h2>

        <motion.div
          className={styles.grid}
          variants={fadeUpContainer}
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
        >
          {releases.map((release) => (
            <motion.div key={release.id} variants={fadeUpItem} className={styles.gridCell}>
              <ListenTile release={release} sizes={SIZES} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
