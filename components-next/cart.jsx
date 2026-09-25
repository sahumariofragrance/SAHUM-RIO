"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const KEY = "sahumario_cart";
const MAX_QTY = 20;

function readCart() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items, hydrated]);

  const addToCart = useCallback((product) => setItems(current => {
    const existing = current.find(item => item.product_id === product.id);
    if (existing) return current.map(item => item.product_id === product.id ? { ...item, qty: Math.min(MAX_QTY, item.qty + 1) } : item);
    return [...current, { product_id: product.id, name: product.name, price: product.price, image: product.image, alt: product.alt, slug: product.slug, qty: 1 }];
  }), []);

  const updateQty = useCallback((id, qty) => setItems(current => qty <= 0 ? current.filter(item => item.product_id !== id) : current.map(item => item.product_id === id ? { ...item, qty: Math.min(MAX_QTY, qty) } : item)), []);
  const count = useMemo(() => items.reduce((sum, item) => sum + Number(item.qty || 0), 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0), [items]);

  return <CartContext.Provider value={{ items, addToCart, updateQty, count, subtotal }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
