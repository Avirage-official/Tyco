"use client";

import { useParallaxBackground, useRevealOnScroll } from "@/lib/motion/useScrollReveal";
import type { AboutSlide } from "@/lib/supabase/types";
import styles from "./CreatorPage.module.css";

export function Chapter({
  background,
  children,
}: {
  background?: AboutSlide | null;
  children?: React.ReactNode;
}) {
  const bgRef = useParallaxBackground<HTMLDivElement>();
  const contentRef = useRevealOnScroll<HTMLDivElement>();

  return (
    <section className={styles.chapter}>
      {background && (
        <div ref={bgRef} className={styles.chapterBgWrap}>
          {background.type === "video" ? (
            <video className={styles.chapterBg} src={background.url} muted loop autoPlay playsInline />
          ) : (
            <div className={styles.chapterBg} style={{ backgroundImage: `url(${background.url})` }} />
          )}
        </div>
      )}
      <div className={styles.chapterScrim} aria-hidden />
      {children && (
        <div ref={contentRef} className={styles.chapterInner}>
          {children}
        </div>
      )}
    </section>
  );
}
