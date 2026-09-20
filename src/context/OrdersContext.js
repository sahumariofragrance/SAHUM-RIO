import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const OrdersContext = createContext(null);
const cacheKey = (userId) => `sahumario_orders_${userId}`;
const normalizeOrder = (o) => ({ ...o, createdAt: o.created_at || o.createdAt });

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [activeUserId, setActiveUserId] = useState(null);

  const refreshOrders = useCallback(async (userIdOverride) => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = userIdOverride || session?.user?.id;
      if (!userId) {
        setActiveUserId(null);
        setOrders([]);
        return;
      }

      setActiveUserId(userId);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const next = (data || []).map(normalizeOrder);
      setOrders(next);
      try { localStorage.setItem(cacheKey(userId), JSON.stringify(next)); } catch {}
    } catch (err) {
      setOrdersError("We couldn't refresh your orders. Showing the most recent saved copy when available.");
      if (activeUserId) {
        try {
          const cached = localStorage.getItem(cacheKey(activeUserId));
          if (cached) setOrders(JSON.parse(cached));
        } catch {}
      }
    } finally {
      setOrdersLoading(false);
    }
  }, [activeUserId]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const id = session?.user?.id;
      if (!id) {
        setOrders([]);
        setOrdersLoading(false);
        return;
      }
      try {
        const cached = localStorage.getItem(cacheKey(id));
        if (cached) setOrders(JSON.parse(cached));
      } catch {}
      refreshOrders(id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user?.id;
      if (!id) {
        setActiveUserId(null);
        setOrders([]);
        setOrdersError("");
        setOrdersLoading(false);
      } else {
        try {
          const cached = localStorage.getItem(cacheKey(id));
          setOrders(cached ? JSON.parse(cached) : []);
        } catch { setOrders([]); }
        refreshOrders(id);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [refreshOrders]);

  useEffect(() => {
    if (!activeUserId) return;
    try { localStorage.setItem(cacheKey(activeUserId), JSON.stringify(orders)); } catch {}
  }, [orders, activeUserId]);

  const fetchAddress = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    if (error) return null;
    return data || null;
  }, []);

  const saveAddress = useCallback(async (addressData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    const profile = {
      id: session.user.id,
      name: addressData?.name || null,
      phone: addressData?.phone || null,
      email: addressData?.email || session.user.email || null,
      address: addressData?.address || null,
      city: addressData?.city || null,
      state: addressData?.state || null,
      pin: addressData?.pin || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("profiles").upsert(profile);
    return !error;
  }, []);

  return <OrdersContext.Provider value={{ orders, ordersLoading, ordersError, refreshOrders, fetchAddress, saveAddress }}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used inside <OrdersProvider>");
  return ctx;
}
