import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "ghost" | "ink";

type CommonProps = {
  variant?: Variant;
  full?: boolean;
  children: React.ReactNode;
};

function classesFor({ variant = "primary", full }: { variant?: Variant; full?: boolean }) {
  return [styles.btn, styles[variant], full ? styles.full : ""].filter(Boolean).join(" ");
}

export function Button({
  variant,
  full,
  className,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return <button className={`${classesFor({ variant, full })} ${className ?? ""}`} {...rest} />;
}

export function LinkButton({
  href,
  variant,
  full,
  children,
  className,
}: CommonProps & { href: string; className?: string }) {
  return (
    <Link href={href} className={`${classesFor({ variant, full })} ${className ?? ""}`}>
      {children}
    </Link>
  );
}
