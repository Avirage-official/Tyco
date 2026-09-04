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
          Save on the spots you already love. Discover the ones you&apos;ll
          love next.
        </motion.h1>
        <motion.p className={styles.lede} variants={fadeUpItem}>
          Deals that support the culture you love — while giving rising Asian
          artists the spotlight and backing they deserve.
        </motion.p>
        <motion.div className={styles.actions} variants={fadeUpItem}>
          <LinkButton href="/signup">Sign up</LinkButton>
          <LinkButton href="/login" variant="ghost">
            Sign in
          </LinkButton>
          <LinkButton href="/studio/deals" variant="ink">
            See Deals
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
