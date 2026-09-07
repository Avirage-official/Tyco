"use client";

import { motion } from "motion/react";
import { ShopCard, type ShopItem } from "@/components/home/FeaturedShop";
import { fadeUpContainer, revealViewport } from "@/lib/motion/variants";
import styles from "./shop.module.css";

export function ShopGrid({ products }: { products: ShopItem[] }) {
  return (
    <motion.div
      className={styles.grid}
      variants={fadeUpContainer}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      {products.map((product, i) => (
        <ShopCard key={product.id} item={product} position={i} />
      ))}
    </motion.div>
  );
}
