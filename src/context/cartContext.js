import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import api from "../lib/api";
import { useAuth } from "./AuthContext";

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const syncRemote = useCallback(async (nextItems) => {
    if (!user) return;
    await api("/cart", { method: "PUT", body: { items: nextItems } });
  }, [user]);

  useEffect(() => {
    let mounted = true;
    async function loadCart() {
      if (!user) {
        if (mounted) setItems([]);
        return;
      }

      try {
        const data = await api("/cart");
        if (mounted) setItems(data?.items || []);
      } catch {
        if (mounted) setItems([]);
      }
    }

    loadCart();
    return () => { mounted = false; };
  }, [user]);

  const addToCart = useCallback((product) => {
    if (!product?.id || !product?.price) return;

    setItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      const next = existing
        ? prev.map((item) =>
            item.product_id === product.id ? { ...item, qty: item.qty + 1 } : item
          )
        : [...prev, { product_id: product.id, name: product.name, price: product.price, qty: 1 }];
      syncRemote(next).catch(() => {});
      return next;
    });
  }, [syncRemote]);

  const updateQty = useCallback((itemId, qty) => {
    setItems((prev) => {
      const next = qty <= 0
        ? prev.filter((item) => item.product_id !== itemId)
        : prev.map((item) => (item.product_id === itemId ? { ...item, qty } : item));
      syncRemote(next).catch(() => {});
      return next;
    });
  }, [syncRemote]);

  const removeItem = useCallback((itemId) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.product_id !== itemId);
      syncRemote(next).catch(() => {});
      return next;
    });
  }, [syncRemote]);

  const clearCart = useCallback(() => {
    setItems([]);
    syncRemote([]).catch(() => {});
  }, [syncRemote]);

  const count = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.qty * item.price, 0), [items]);

  return (
    <CartCtx.Provider value={{ items, addToCart, updateQty, removeItem, clearCart, count, subtotal }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
