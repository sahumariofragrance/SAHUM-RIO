import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const OrdersContext = createContext(null);
const ORDERS_KEY = "sahumario_orders";

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(() => {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Persist orders to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch {
      // Silently ignore write errors (e.g. private browsing storage limit)
    }
  }, [orders]);

  // When user logs in, load their orders from Supabase (source of truth)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) return;
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error || !data) return;

        // Normalize Supabase rows to match local order shape
        setOrders(data.map((o) => ({ ...o, createdAt: o.created_at })));
      } catch {
        // Network issue — keep showing local orders
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // orderData shape: { id, items, subtotal, address, payment, createdAt }
  const addOrder = useCallback(async (orderData) => {
    // 1. Optimistic local update (immediate)
    setOrders((prev) => [orderData, ...prev]);

    // 2. Persist to Supabase if user is logged in
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { error } = await supabase.from("orders").insert({
          id: orderData.id,
          user_id: session.user.id,
          items: orderData.items,
          subtotal: orderData.subtotal,
          address: orderData.address,
          payment: orderData.payment,
          created_at: orderData.createdAt,
        });
        if (error) console.warn("[Orders] Supabase insert failed:", error.message);
      }
    } catch (err) {
      console.warn("[Orders] Failed to sync to Supabase:", err.message);
    }
  }, []);

  const fetchAddress = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.warn("[Orders] Failed to fetch address:", error.message);
      }
      return data || null;
    } catch (err) {
      console.warn("[Orders] Failed to fetch address:", err.message);
      return null;
    }
  }, []);

  const saveAddress = useCallback(async (addressData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: session.user.id,
          ...addressData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.warn("[Orders] Failed to save address:", error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn("[Orders] Failed to save address:", err.message);
      return false;
    }
  }, []);

  return (
    <OrdersContext.Provider value={{ orders, addOrder, fetchAddress, saveAddress }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used inside <OrdersProvider>");
  return ctx;
}
