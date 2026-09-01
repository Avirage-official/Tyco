import type { Metadata } from "next";
import Link from "next/link";
import { VideoHero } from "@/components/home/VideoHero";
import { IconArrowRight, IconBag, IconMark } from "@/components/icons";
import styles from "./about.module.css";

export const metadata: Metadata = { title: "About" };

const pillars = [
  {
    href: "/studio",
    icon: IconMark,
    title: "Happenings",
    desc: "The creative work behind the collective, and every event we've thrown or have coming up.",
  },
  {
    href: "/shop",
    icon: IconBag,
    title: "Shop",
    desc: "Clothing cut from the same idea as the sound — small runs, made to be worn in.",
  },
];

const principles = [
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
          <span>Happenings</span>
          <span>&mdash;</span>
          <span>Retail</span>
          <span>&mdash;</span>
          <span>Black, red, cream</span>
        </div>
      </div>

      <section className={`container ${styles.manifesto}`}>
        <h2 className={styles.manifestoTitle}>
          Community and commerce, working together.
        </h2>
        <div className={styles.manifestoBody}>
          <div className={styles.manifestoText}>
            <p>
              TYCO is a Southeast Asia-rooted creative collective — part community, part
              commerce. We make apparel that carries the brand&apos;s identity, back the
              creators and events building culture around us, and we&apos;re opening up
              real access: discounted rates at the studios, barbers, bars, and lessons
              creatives already spend on, through partner vendors who back the same scene.
            </p>
            <p>
              Retail funds the collective today. Membership makes the lifestyle more
              affordable tomorrow. As the audience and creative network around us grow,
              so does what we&apos;re able to build together.
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
