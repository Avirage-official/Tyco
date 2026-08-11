import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Spotlight, type SpotlightProps } from "@/components/home/Spotlight";
import { Slideshow } from "@/components/home/Slideshow";
import { VideoHero } from "@/components/home/VideoHero";
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
      <VideoHero>
        <h1 className={styles.title}>
          TYCO. Where sound, style, and culture <em>collide</em>.
        </h1>
        <p className={styles.lede}>
          The best work doesn&apos;t just exist. It moves. It changes something.
          Everything we create is built on that belief.
        </p>
        <div className={styles.actions}>
          <LinkButton href="/signup">Sign up</LinkButton>
          <LinkButton href="/login" variant="ghost">
            Sign in
          </LinkButton>
          <LinkButton href="/about" variant="ink">
            About us
          </LinkButton>
        </div>
        {spotlight && (
          <div className={styles.spotlightSlot}>
            <Spotlight {...spotlight} />
          </div>
        )}
        <nav className={styles.quickLinks} aria-label="Quick links">
          <Link href="/studio">Studio</Link>
          <span aria-hidden>&middot;</span>
          <Link href="/shop">Shop</Link>
        </nav>
      </VideoHero>

      <section className={styles.aboutSection}>
        <span className={styles.aboutImage} aria-hidden />
        <span className={styles.aboutOverlay} aria-hidden />
        <div className={`container ${styles.aboutInner}`}>
          <p className="eyebrow">Who we are</p>
          <h2 className={styles.aboutTitle}>
            An artistic collective, not a label with a merch table.
          </h2>
          <p className={styles.aboutBody}>
            TYCO is a Singapore-based artistic collective operating across music
            production, fashion design, live events, and brand collaborations —
            each revenue stream feeding our annual community mission fund.
            We&apos;re not a nonprofit. We&apos;re artists who make money and
            choose where it goes.
          </p>
          <div className={styles.aboutActions}>
            <LinkButton href="/about" variant="ghost">
              Read our full story
            </LinkButton>
          </div>
        </div>
      </section>

      {slides.length > 0 && <Slideshow slides={slides} />}
    </>
  );
}
