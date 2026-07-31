"use client";

import Link from "next/link";
import { IconBag } from "@/components/icons";
import { useCart } from "@/lib/cart/CartContext";
import styles from "./CartLink.module.css";

export function CartLink({ className }: { className?: string }) {
  const { count } = useCart();

  return (
    <Link href="/cart" className={`${styles.link} ${className ?? ""}`} aria-label={`Cart, ${count} items`}>
      <IconBag className={styles.icon} />
      {count > 0 && <span className={styles.badge}>{count > 99 ? "99+" : count}</span>}
    </Link>
  );
}
