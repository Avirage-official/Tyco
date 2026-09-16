"use client";

import { useId } from "react";
import Link from "next/link";
import { LayoutGroup, motion } from "motion/react";
import { DUR, EASE_IN_OUT } from "@/lib/motion/variants";
import styles from "./Chip.module.css";

/**
 * A horizontal row of filter pills. Exactly one chip is active; its
 * filled background slides between chips with a shared `layoutId`. Chips
 * are links when the filter lives in the URL (the usual case) or buttons
 * when it is local state.
 */
export function ChipGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <nav aria-label={label} className={className ? `${styles.group} ${className}` : styles.group}>
        {children}
      </nav>
    </LayoutGroup>
  );
}

type ChipProps = {
  active?: boolean;
  children: React.ReactNode;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

export function Chip({ active = false, children, href, onClick }: ChipProps) {
  const className = active ? `${styles.chip} ${styles.active}` : styles.chip;
  const inner = (
    <>
      {active && (
        <motion.span
          className={styles.indicator}
          layoutId="chip-indicator"
          transition={{ duration: DUR, ease: EASE_IN_OUT }}
          aria-hidden
        />
      )}
      <span className={styles.label}>{children}</span>
    </>
  );

  if (href !== undefined) {
    return (
      <Link href={href} className={className} aria-current={active ? "page" : undefined}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={className} aria-pressed={active} onClick={onClick}>
      {inner}
    </button>
  );
}
