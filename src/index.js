import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { OrdersProvider } from "./context/OrdersContext";
import { CartProvider } from "./context/cartContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <OrdersProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </OrdersProvider>
  </React.StrictMode>
);