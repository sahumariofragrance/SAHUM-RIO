import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";

const CartCtx = createContext(null);
const CART_STORAGE_KEY = "sahumario_cart";
const MAX_CART_LINES = 50;
const MAX_QTY_PER_ITEM = 20;

function normalizeStoredCart(value) {
  if (!Array.isArray(value)) return [];
  const byId = new Map();

  for (const raw of value.slice(0, MAX_CART_LINES * 2)) {
    const productId = Number(raw?.product_id);
    const qty = Number(raw?.qty);
    const price = Number(raw?.price);
    if (!Number.isInteger(productId) || productId <= 0) continue;
    if (!Number.isInteger(qty) || qty <= 0) continue;
    if (!Number.isFinite(price) || price <= 0) continue;

    const current = byId.get(productId);
    const safeQty = Math.min(MAX_QTY_PER_ITEM, (current?.qty || 0) + qty);
    byId.set(productId, {
      product_id: productId,
      name: String(raw?.name || "").slice(0, 160),
      price,
      image: String(raw?.image || "").slice(0, 1000),
      alt: String(raw?.alt || "").slice(0, 240),
      slug: String(raw?.slug || "").slice(0, 160),
      qty: safeQty,
    });
    if (byId.size >= MAX_CART_LINES) break;
  }
  return [...byId.values()];
}

export function CartProvider({ children }) {
  // Initialise from localStorage on first render
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return normalizeStoredCart(parsed);
    } catch {
      return [];
    }
  });

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Silently ignore write errors (e.g. private browsing storage limit)
    }
  }, [items]);

  const addToCart = useCallback((product) => {
    if (!product?.id || !product?.price) {
      console.warn("CartContext: addToCart called with invalid product", product);
      return;
    }
    setItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id ? {
            ...item,
            name: product.name,
            price: product.price,
            image: product.image || product.image_url || item.image || "",
            alt: product.alt || item.alt || `${product.name} Eau de Parfum bottle`,
            slug: product.slug || item.slug || "",
            qty: Math.min(MAX_QTY_PER_ITEM, item.qty + 1),
          } : item
        );
      }
      if (prev.length >= MAX_CART_LINES) return prev;
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || product.image_url || "",
        alt: product.alt || `${product.name} Eau de Parfum bottle`,
        slug: product.slug || "",
        qty: 1,
      }];
    });
  }, []);

  const updateQty = useCallback((itemId, qty) => {
    setItems((prev) => {
      // Removing item when qty reaches 0
      const safeQty = Number(qty);
      if (!Number.isFinite(safeQty) || safeQty <= 0) return prev.filter((item) => item.product_id !== itemId);
      const boundedQty = Math.min(MAX_QTY_PER_ITEM, Math.max(1, Math.floor(safeQty)));
      return prev.map((item) => (item.product_id === itemId ? { ...item, qty: boundedQty } : item));
    });
  }, []);

  const removeItem = useCallback((itemId) => {
    setItems((prev) => prev.filter((item) => item.product_id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Derived totals — no tax applied; add tax logic here if required
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
