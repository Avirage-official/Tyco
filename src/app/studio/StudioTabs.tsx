"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./StudioTabs.module.css";

const tabs = [
  { href: "/studio", label: "Events" },
  { href: "/studio/creators", label: "Creators" },
];

export function StudioTabs() {
  const pathname = usePathname();
  const railRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  function movePillTo(el: HTMLElement | null | undefined) {
    if (!el || !railRef.current) return;
    const railRect = railRef.current.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setPill({ left: rect.left - railRect.left, width: rect.width });
  }

  function resetPill() {
    const activeEl = railRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) movePillTo(activeEl);
  }

  useLayoutEffect(() => {
    resetPill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav ref={railRef} aria-label="Happenings sections" className={styles.tabs} onMouseLeave={resetPill}>
      {pill && (
        <span
          className={styles.pill}
          style={{ transform: `translateX(${pill.left}px)`, width: pill.width }}
          aria-hidden
        />
      )}
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            data-active={active}
            className={active ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            aria-current={active ? "page" : undefined}
            onMouseEnter={(e) => movePillTo(e.currentTarget)}
            onFocus={(e) => movePillTo(e.currentTarget)}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
