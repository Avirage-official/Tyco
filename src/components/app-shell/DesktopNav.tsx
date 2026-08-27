"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./TopNav.module.css";

const flatLinks = [
  { href: "/studio", label: "Happenings", index: "01" },
  { href: "/shop", label: "Shop", index: "02" },
  { href: "/about", label: "About", index: "03" },
  { href: "/account/tickets", label: "Your tickets", index: "04" },
  { href: "/account/orders", label: "Your orders", index: "05" },
];

function linkMatches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const railRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);

  const activeHref = flatLinks.find((item) => linkMatches(pathname, item.href))?.href;
  const accountActive = pathname === "/account";

  function movePillTo(el: HTMLElement | null | undefined) {
    if (!el || !railRef.current) return;
    const railRect = railRef.current.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setPill({ left: rect.left - railRect.left, width: rect.width });
  }

  function resetPill() {
    const activeEl = railRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      movePillTo(activeEl);
    } else {
      setPill(null);
    }
  }

  useLayoutEffect(() => {
    resetPill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("resize", resetPill);
    return () => window.removeEventListener("resize", resetPill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    function handleClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [accountOpen]);

  async function handleSignOut() {
    setAccountOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className={styles.links} aria-label="Primary">
      <div ref={railRef} className={styles.rail} onMouseLeave={resetPill}>
        {pill && (
          <span
            className={styles.hoverPill}
            style={{ transform: `translateX(${pill.left}px)`, width: pill.width }}
            aria-hidden
          />
        )}
        {flatLinks.map((item) => {
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active}
              className={active ? `${styles.link} ${styles.linkActive}` : styles.link}
              aria-current={active ? "page" : undefined}
              onMouseEnter={(e) => movePillTo(e.currentTarget)}
              onFocus={(e) => movePillTo(e.currentTarget)}
            >
              <span className={styles.linkIndex} aria-hidden>
                {item.index}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {signedIn && (
        <div ref={accountRef} className={styles.menuRoot}>
          <button
            type="button"
            className={accountActive ? `${styles.link} ${styles.linkActive}` : styles.link}
            aria-expanded={accountOpen}
            aria-haspopup="true"
            onClick={() => setAccountOpen((v) => !v)}
          >
            Account
          </button>
          {accountOpen && (
            <div className={styles.menuPanel} role="menu">
              <Link
                href="/account"
                role="menuitem"
                className={styles.menuPanelLink}
                onClick={() => setAccountOpen(false)}
              >
                Your account
              </Link>
              <button type="button" role="menuitem" className={styles.menuPanelLink} onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
