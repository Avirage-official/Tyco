"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  priceCents: number;
  currency: string;
  coverUrl: string | null;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  subtotalCents: number;
  count: number;
};

const STORAGE_KEY = "tyco-cart";

const CartCtx = createContext<CartState | null>(null);

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const setQuantity = useCallback(
    (variantId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(variantId);
        return;
      }
      setItems((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)));
    },
    [removeItem]
  );

  const clear = useCallback(() => {
    setItems((prev) => (prev.length === 0 ? prev : []));
  }, []);

  const subtotalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
    [items]
  );
  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const value = useMemo<CartState>(
    () => ({ items, addItem, removeItem, setQuantity, clear, subtotalCents, count }),
    [items, addItem, removeItem, setQuantity, clear, subtotalCents, count]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
