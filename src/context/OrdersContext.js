import React, { createContext, useContext, useEffect, useState } from "react";

const OrdersContext = createContext();
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

  useEffect(() => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  // orderData: { id, items, subtotal, tax, total, address, payment, createdAt }
  const addOrder = (orderData) => {
    setOrders((prev) => [orderData, ...prev]); // newest first
  };

  return (
    <OrdersContext.Provider value={{ orders, addOrder }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrdersContext);
}