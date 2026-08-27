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
          <Link href="/creators">Creators</Link>
          <span aria-hidden>&middot;</span>
          <Link href="/studio">Happenings</Link>
          <span aria-hidden>&middot;</span>
          <Link href="/shop">Shop</Link>
        </nav>
      </VideoHero>

      <section className={styles.about}>
        <div className={`container ${styles.aboutGrid}`}>
          <div className={styles.aboutMedia}>
            <span className={styles.aboutImage} aria-hidden />
            <svg className={`${styles.mark} ${styles.markTl}`} viewBox="0 0 24 24" aria-hidden>
              <path d="M12 0V8M12 24V16M0 12H8M24 12H16" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg className={`${styles.mark} ${styles.markBr}`} viewBox="0 0 24 24" aria-hidden>
              <path d="M12 0V8M12 24V16M0 12H8M24 12H16" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className={styles.coord} aria-hidden>
              1.3521&deg;N / 103.8198&deg;E — Singapore
            </span>
          </div>

          <div className={styles.aboutContent}>
            <div className={styles.index}>
              <span className={styles.indexNum}>01</span>
              <span className={styles.indexDash} aria-hidden />
              <span className={styles.indexLabel}>Who we are</span>
            </div>
            <h2 className={styles.aboutTitle}>
              An artistic collective, not a <em>label</em> with a merch table.
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
        </div>
      </section>

      {slides.length > 0 && <Slideshow slides={slides} />}
    </>
  );
}
