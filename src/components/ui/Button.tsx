"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { MotionLink } from "@/lib/motion/MotionLink";
import styles from "./Button.module.css";

type Variant = "primary" | "ghost" | "ink";

type CommonProps = {
  variant?: Variant;
  full?: boolean;
  children: React.ReactNode;
};

const press = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.96 },
  transition: { type: "spring", stiffness: 420, damping: 28 } as const,
};

function classesFor({ variant = "primary", full }: { variant?: Variant; full?: boolean }) {
  return [styles.btn, styles[variant], full ? styles.full : ""].filter(Boolean).join(" ");
}

export function Button({
  variant,
  full,
  className,
  ...rest
}: CommonProps & HTMLMotionProps<"button"> & { className?: string }) {
  return (
    <motion.button
      className={`${classesFor({ variant, full })} ${className ?? ""}`}
      {...press}
      {...rest}
    />
  );
}

export function LinkButton({
  href,
  variant,
  full,
  children,
  className,
}: CommonProps & { href: string; className?: string }) {
  return (
    <MotionLink
      href={href}
      className={`${classesFor({ variant, full })} ${className ?? ""}`}
      {...press}
    >
      {children}
    </MotionLink>
  );
}
