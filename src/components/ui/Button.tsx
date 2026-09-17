"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { MotionLink } from "@/lib/motion/MotionLink";
import { pressSpring } from "@/lib/motion/variants";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type ButtonSize = "md" | "sm";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  className?: string;
  children: React.ReactNode;
};

const press = {
  whileTap: { scale: 0.97 },
  transition: pressSpring,
};

function classesFor({ variant = "primary", size = "md", full, className }: CommonProps) {
  return [styles.btn, styles[variant], size === "sm" ? styles.sm : "", full ? styles.full : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant,
  size,
  full,
  className,
  children,
  ...rest
}: CommonProps & Omit<HTMLMotionProps<"button">, "children">) {
  return (
    <motion.button className={classesFor({ variant, size, full, className, children })} {...press} {...rest}>
      {children}
    </motion.button>
  );
}

export function LinkButton({
  href,
  variant,
  size,
  full,
  className,
  children,
}: CommonProps & { href: string }) {
  return (
    <MotionLink href={href} className={classesFor({ variant, size, full, className, children })} {...press}>
      {children}
    </MotionLink>
  );
}
