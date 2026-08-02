import Link from "next/link";
import { IconArrowRight, IconBag, IconMark, IconWaves } from "@/components/icons";
import { LinkButton } from "@/components/ui/Button";
import { Spotlight, type SpotlightProps } from "@/components/home/Spotlight";
import styles from "./Marketing.module.css";

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

export function Marketing({ spotlight }: { spotlight: SpotlightProps | null }) {
  return (
    <>
      <section className={styles.hero}>
        <video className={styles.heroVideo} autoPlay muted loop playsInline aria-hidden="true">
          <source src="/video/home-hero.mp4" type="video/mp4" />
        </video>
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={`container ${styles.heroInner}`}>
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
            <LinkButton href="/signup">Sign up</LinkButton>
            <LinkButton href="/login" variant="ghost">
              Sign in
            </LinkButton>
          </div>
          {spotlight && (
            <div className={styles.spotlightSlot}>
              <Spotlight {...spotlight} />
            </div>
          )}
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

      <section className={`container ${styles.manifesto}`}>
        <h2 className={styles.manifestoTitle}>
          Not a label with a merch table. One house, built the other way around.
        </h2>
        <div className={styles.manifestoBody}>
          <p>
            Most of what carries the Tyco name starts as a song. It gets built in
            public — the demos, the flyers for a show, the sample of fabric before
            it&apos;s a shirt — instead of arriving finished. The studio journal is
            that process, not a highlight reel.
          </p>
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
