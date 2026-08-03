import type { Metadata } from "next";
import Link from "next/link";
import { VideoHero } from "@/components/home/VideoHero";
import { IconArrowRight, IconBag, IconMark, IconWaves } from "@/components/icons";
import styles from "./about.module.css";

export const metadata: Metadata = { title: "About" };

const pillars = [
  {
    href: "/music",
    icon: IconWaves,
    title: "Music",
    desc: "Every release, free to stream. No paywall between the songs and the people who want them.",
  },
  {
    href: "/studio",
    icon: IconMark,
    title: "Studio",
    desc: "The creative work behind the music, and every event we've thrown or have coming up.",
  },
  {
    href: "/shop",
    icon: IconBag,
    title: "Shop",
    desc: "Clothing cut from the same idea as the sound — small runs, made to be worn in.",
  },
];

const principles = [
  { title: "Free, always", desc: "Every track stays free to stream. That's not a launch promo, it's the model." },
  { title: "Made in small batches", desc: "The shop restocks in short runs instead of sitting on a warehouse of stock." },
  { title: "One studio, one journal", desc: "The work-in-progress and the finished releases live in the same place." },
];

export default function AboutPage() {
  return (
    <>
      <VideoHero size="compact">
        <p className="eyebrow">About us</p>
        <h1 className={styles.heroTitle}>Who we are</h1>
      </VideoHero>

      <div className={styles.strip}>
        <div className={`container ${styles.stripInner}`}>
          <span>Free music</span>
          <span>&mdash;</span>
          <span>Studio &amp; events</span>
          <span>&mdash;</span>
          <span>Retail</span>
          <span>&mdash;</span>
          <span>Black, red, cream</span>
        </div>
      </div>

      <section className={`container ${styles.manifesto}`}>
        <h2 className={styles.manifestoTitle}>
          Creativity and social responsibility, inseparable.
        </h2>
        <div className={styles.manifestoBody}>
          <div className={styles.manifestoText}>
            <p>
              TYCO is a Singapore-based artistic collective founded on the principle that
              creativity and social responsibility are inseparable. We operate across
              music production, fashion design, live events, and brand collaborations —
              each revenue stream feeding our annual community mission fund. We&apos;re
              not a nonprofit. We&apos;re artists who make money and choose where it goes.
            </p>
            <p>
              Through music, design, events, and partnerships, we build culture that
              funds itself forward. Every release, every piece, every night we create —
              it moves something.
            </p>
          </div>
          <ul className={styles.principles}>
            {principles.map((p) => (
              <li key={p.title}>
                <span className={styles.principleDot} aria-hidden />
                <div>
                  <p className={styles.principleTitle}>{p.title}</p>
                  <p className={styles.principleDesc}>{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`container ${styles.pillars}`}>
        {pillars.map((p) => {
          const Icon = p.icon;
          return (
            <Link key={p.href} href={p.href} className={styles.card}>
              <span className={styles.cardIcon}>
                <Icon />
              </span>
              <h2 className={styles.cardTitle}>{p.title}</h2>
              <p className={styles.cardDesc}>{p.desc}</p>
              <span className={styles.cardLink}>
                Explore <IconArrowRight />
              </span>
            </Link>
          );
        })}
      </section>
    </>
  );
}
