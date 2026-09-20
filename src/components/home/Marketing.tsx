"use client";

import { motion } from "motion/react";
import { LinkButton } from "@/components/ui/Button";
import { WhoWeAreHero } from "@/components/home/WhoWeAreHero";
import { VideoHero } from "@/components/home/VideoHero";
import { DiscoveryRow } from "@/components/home/DiscoveryRow";
import { ListenStrip, type ReleasePreview } from "@/components/home/ListenStrip";
import { DealCard } from "@/app/deals/DealCard";
import { EventCard } from "@/app/happenings/EventCard";
import type { DealSummary } from "@/lib/deals/catalog";
import type { EventSummary } from "@/lib/events/catalog";
import { fadeUpItem } from "@/lib/motion/variants";
import type { AboutSlide } from "@/lib/supabase/types";
import styles from "./Marketing.module.css";

/**
 * The signed-out homepage. A visitor who has never heard of Tyco needs to
 * see what it sells before being asked to sign up, so the hero leads
 * straight into real deals and real dates; the story about who Tyco is
 * sits below them, for the people it has already interested.
 */
export function Marketing({
  deals,
  events,
  slides,
  releases,
}: {
  deals: DealSummary[];
  events: EventSummary[];
  slides: AboutSlide[];
  releases: ReleasePreview[];
}) {
  return (
    <>
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
          <LinkButton href="/deals">See Deals</LinkButton>
          <LinkButton href="/signup" variant="secondary">
            Sign up
          </LinkButton>
        </motion.div>
      </VideoHero>

      {deals.length > 0 && (
        <DiscoveryRow
          title="Deals this month"
          description="Member prices at the studios, shops and services creatives already spend on."
          action={{ href: "/deals", label: "See all" }}
        >
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </DiscoveryRow>
      )}

      {events.length > 0 && (
        <DiscoveryRow
          title="Happening next"
          description="Shows, sessions and parties run by Tyco and the people we work with."
          action={{ href: "/happenings", label: "See all" }}
        >
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </DiscoveryRow>
      )}

      <WhoWeAreHero slides={slides} />

      <ListenStrip releases={releases} />
    </>
  );
}
