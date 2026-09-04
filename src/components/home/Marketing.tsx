"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { LinkButton } from "@/components/ui/Button";
import { Spotlight, type SpotlightProps } from "@/components/home/Spotlight";
import { WhoWeAreHero } from "@/components/home/WhoWeAreHero";
import { VideoHero } from "@/components/home/VideoHero";
import { fadeUpItem } from "@/lib/motion/variants";
import type { AboutSlide } from "@/lib/supabase/types";
import styles from "./Marketing.module.css";

export function Marketing({
  spotlight,
  slides,
}: {
  spotlight: SpotlightProps | null;
  slides: AboutSlide[];
}) {
  return (
    <>
      <WhoWeAreHero slides={slides} />

      <VideoHero>
        <motion.h1 className={styles.title} variants={fadeUpItem}>
          TYCO. Where sound, style, and culture <em>collide</em>.
        </motion.h1>
        <motion.p className={styles.lede} variants={fadeUpItem}>
          The best work doesn&apos;t just exist. It moves. It changes something.
          Everything we create is built on that belief.
        </motion.p>
        <motion.div className={styles.actions} variants={fadeUpItem}>
          <LinkButton href="/signup">Sign up</LinkButton>
          <LinkButton href="/login" variant="ghost">
            Sign in
          </LinkButton>
          <LinkButton href="/about" variant="ink">
            About us
          </LinkButton>
        </motion.div>
        {spotlight && (
          <motion.div className={styles.spotlightSlot} variants={fadeUpItem}>
            <Spotlight {...spotlight} />
          </motion.div>
        )}
        <motion.nav className={styles.quickLinks} aria-label="Quick links" variants={fadeUpItem}>
          <Link href="/studio">Happenings</Link>
          <span aria-hidden>&middot;</span>
          <Link href="/shop">Shop</Link>
        </motion.nav>
      </VideoHero>
    </>
  );
}
