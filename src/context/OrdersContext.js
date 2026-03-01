import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "./AuthContext";

const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  const loadOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }

    try {
      const data = await api("/orders");
      setOrders(data?.orders || []);
    } catch (err) {
      console.warn("[Orders] Failed to load orders:", err.message);
      setOrders([]);
    }
  }, [user]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const addOrder = useCallback(async (orderData) => {
    if (!user) {
      throw new Error("Please login to place an order.");
    }

    const data = await api("/orders", {
      method: "POST",
      body: orderData,
    });

    if (data?.order) {
      setOrders((prev) => [data.order, ...prev]);
      return data.order;
    }

    return null;
  }, [user]);

  return <OrdersContext.Provider value={{ orders, addOrder, reloadOrders: loadOrders }}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used inside <OrdersProvider>");
  return ctx;
}
