import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Spotlight, type SpotlightProps } from "@/components/home/Spotlight";
import { Slideshow } from "@/components/home/Slideshow";
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
      <section className={styles.hero}>
        <video className={styles.heroVideo} autoPlay muted loop playsInline aria-hidden="true">
          <source src="/video/home-hero.mp4" type="video/mp4" />
        </video>
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={`container ${styles.heroInner}`}>
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
            <Link href="/music">Music</Link>
            <span aria-hidden>&middot;</span>
            <Link href="/studio">Studio</Link>
            <span aria-hidden>&middot;</span>
            <Link href="/shop">Shop</Link>
          </nav>
        </div>
      </section>

      {slides.length > 0 && <Slideshow slides={slides} />}
    </>
  );
}
