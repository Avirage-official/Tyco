import Link from "next/link";
import { IconArrowRight, IconBag, IconMark, IconWaves } from "@/components/icons";
import { LinkButton } from "@/components/ui/Button";
import styles from "./page.module.css";

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

export default function Home() {
  return (
    <>
      <section className={`container ${styles.hero}`}>
        <div className={styles.eyebrowRow}>
          <span className={styles.dot} aria-hidden />
          <p className="eyebrow">Free music &middot; Studio journal &middot; Shop</p>
        </div>
        <h1 className={styles.title}>
          Sound, story, and <em>cloth</em> — one house.
        </h1>
        <p className={styles.lede}>
          Tyco is a home for the music we give away, the work we make along the way,
          and the clothes that carry the same idea. Put it on your phone like an app —
          it&apos;s just the web, dressed up.
        </p>
        <div className={styles.actions}>
          <LinkButton href="/music">Listen now</LinkButton>
          <LinkButton href="/studio" variant="ghost">
            See the studio
          </LinkButton>
        </div>
      </section>

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
