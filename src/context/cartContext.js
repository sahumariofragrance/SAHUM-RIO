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

export function CartProvider({ children }) {
  // Initialise from localStorage on first render
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.filter((item) => [1, 2, 3, 4, 5].includes(Number(item?.product_id))) : [];
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
        // Increment quantity if already in cart
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((itemId, qty) => {
    setItems((prev) => {
      // Removing item when qty reaches 0
      if (qty <= 0) return prev.filter((item) => item.product_id !== itemId);
      return prev.map((item) => (item.product_id === itemId ? { ...item, qty } : item));
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
