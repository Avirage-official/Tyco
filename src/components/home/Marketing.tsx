import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Spotlight, type SpotlightProps } from "@/components/home/Spotlight";
import { WhoWeAreHero } from "@/components/home/WhoWeAreHero";
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
      <WhoWeAreHero slides={slides} />

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
    </>
  );
}
