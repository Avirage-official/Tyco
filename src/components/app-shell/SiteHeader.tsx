"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "motion/react";
import { CartLink } from "@/components/cart/CartLink";
import { LinkButton } from "@/components/ui/Button";
import { useScrolledPast } from "@/lib/hooks/useScrolledPast";
import { DUR, EASE_IN_OUT } from "@/lib/motion/variants";
import type { NavHiddenItems } from "@/lib/supabase/types";
import { AccountMenu } from "./AccountMenu";
import { Wordmark } from "./Wordmark";
import { getActiveHref, primaryNav, visibleNavItems } from "./nav-items";
import styles from "./SiteHeader.module.css";

/**
 * The desktop header: wordmark, a centred rail of five links at most, and
 * on the right either Log in / Sign up or the account menu, plus the
 * cart. Transparent at the top of the page, solid once the page has
 * scrolled. Hidden below the desktop breakpoint, where MobileHeader
 * takes over.
 */
export function SiteHeader({
  signedIn,
  displayName,
  hiddenItems,
}: {
  signedIn: boolean;
  displayName: string | null;
  hiddenItems: NavHiddenItems;
}) {
  const pathname = usePathname();
  const scrolled = useScrolledPast(40);
  const links = visibleNavItems(primaryNav, hiddenItems);
  const activeHref = getActiveHref(links, pathname);

  return (
    <header className={styles.header} data-scrolled={scrolled}>
      <div className={`container container--wide ${styles.inner}`}>
        <div className={styles.left}>
          <Wordmark />
        </div>

        <nav aria-label="Primary" className={styles.rail}>
          <LayoutGroup id="site-header">
            {links.map((item) => {
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? `${styles.link} ${styles.active}` : styles.link}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      className={styles.underline}
                      layoutId="nav-underline"
                      transition={{ duration: DUR, ease: EASE_IN_OUT }}
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </LayoutGroup>
        </nav>

        <div className={styles.right}>
          {signedIn ? (
            <AccountMenu displayName={displayName} />
          ) : (
            <>
              <Link href="/login" className={styles.textLink}>
                Log in
              </Link>
              <LinkButton href="/signup" size="sm">
                Sign up
              </LinkButton>
            </>
          )}
          <CartLink />
        </div>
      </div>
    </header>
  );
}
