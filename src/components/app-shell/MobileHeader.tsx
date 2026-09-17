"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CartLink } from "@/components/cart/CartLink";
import { IconMenu } from "@/components/icons";
import { LinkButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { signOut } from "@/lib/auth/signOut";
import type { NavHiddenItems } from "@/lib/supabase/types";
import { Wordmark } from "./Wordmark";
import { accountNav, getActiveHref, primaryNav, visibleNavItems, type NavItem } from "./nav-items";
import styles from "./MobileHeader.module.css";

const homeItem: NavItem = { href: "/", label: "Home", match: "exact" };

/**
 * The mobile header: menu button, wordmark, cart. The menu opens a
 * full-height sheet from the right with the site sections, the user's
 * own pages when signed in, and Log in / Sign up when not. Hidden at the
 * desktop breakpoint, where SiteHeader takes over.
 */
export function MobileHeader({
  signedIn,
  displayName,
  hiddenItems,
}: {
  signedIn: boolean;
  displayName: string | null;
  hiddenItems: NavHiddenItems;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const exploreItems = [homeItem, ...visibleNavItems(primaryNav, hiddenItems)];
  const allItems = [...exploreItems, ...accountNav];
  const activeHref = getActiveHref(allItems, pathname);

  // Close the sheet on navigation. Adjusting state during render avoids
  // an extra effect-driven render pass.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }

  function renderLink(item: NavItem) {
    const active = item.href === activeHref;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={active ? `${styles.link} ${styles.active}` : styles.link}
        aria-current={active ? "page" : undefined}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.bar}>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <IconMenu />
        </button>
        <Wordmark />
        <CartLink className={styles.cart} />
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Menu" side="right">
        <nav aria-label="Primary" className={styles.groups}>
          <div className={styles.group}>
            <p className={styles.groupLabel}>Explore</p>
            {exploreItems.map(renderLink)}
          </div>

          {signedIn ? (
            <div className={styles.group}>
              <p className={styles.groupLabel}>{displayName ? `Your account · ${displayName}` : "Your account"}</p>
              {accountNav.map(renderLink)}
              <button type="button" className={styles.link} onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          ) : (
            <div className={styles.auth}>
              <LinkButton href="/signup" full>
                Sign up
              </LinkButton>
              <LinkButton href="/login" variant="ghost" full>
                Log in
              </LinkButton>
            </div>
          )}
        </nav>
      </Sheet>
    </div>
  );
}
