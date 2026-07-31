"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/cart/CartContext";
import styles from "../shop.module.css";

type Variant = { id: string; size: string; stock: number };

export function AddToCartForm({
  productId,
  productName,
  priceCents,
  currency,
  coverUrl,
  variants,
}: {
  productId: string;
  productName: string;
  priceCents: number;
  currency: string;
  coverUrl: string | null;
  variants: Variant[];
}) {
  const { addItem } = useCart();
  const firstInStock = variants.find((v) => v.stock > 0);
  const [selectedId, setSelectedId] = useState<string | null>(firstInStock?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const selected = variants.find((v) => v.id === selectedId) ?? null;

  function selectVariant(variant: Variant) {
    if (variant.stock <= 0) return;
    setSelectedId(variant.id);
    setQuantity(1);
    setJustAdded(false);
  }

  function handleAdd() {
    if (!selected) return;
    addItem(
      {
        variantId: selected.id,
        productId,
        productName,
        size: selected.size,
        priceCents,
        currency,
        coverUrl,
      },
      quantity
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

  if (variants.length === 0) {
    return (
      <div style={{ marginTop: "var(--space-lg)" }}>
        <Button disabled>Unavailable</Button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.sizes}>
        {variants.map((variant) => {
          const soldOut = variant.stock <= 0;
          const isSelected = variant.id === selectedId;
          const className = [
            styles.size,
            soldOut ? styles.sizeSoldOut : "",
            isSelected ? styles.sizeSelected : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={variant.id}
              type="button"
              className={className}
              disabled={soldOut}
              onClick={() => selectVariant(variant)}
              aria-pressed={isSelected}
            >
              {variant.size}
              {soldOut && " · sold out"}
            </button>
          );
        })}
      </div>

      <div className={styles.cartRow}>
        {selected && (
          <div className={styles.qtyStepper}>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span>{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(selected.stock, q + 1))}
              disabled={quantity >= selected.stock}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        )}
        <Button onClick={handleAdd} disabled={!selected}>
          {!selected ? "Sold out" : justAdded ? "Added ✓" : "Add to cart"}
        </Button>
      </div>
    </>
  );
}
