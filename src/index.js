import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import "./index.css";
import { OrdersProvider } from "./context/OrdersContext";
import { CartProvider } from "./context/cartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ProductsProvider } from "./context/ProductsContext";
import { startBotProtection } from "./lib/botProtection";
import { startLiveVisitors } from "./lib/liveVisitors";

startBotProtection();
startLiveVisitors();

// Vercel Web Analytics (cookie-free): daily visitors, top pages and sources.
// Admin, account and password pages are not tracked. Fragments (which can
// carry login tokens) and query strings are removed, except utm_* campaign tags.
const UNTRACKED = /^\/(admin|account|reset-password)(\/|$)/;
function beforeSend(event) {
  const url = new URL(event.url);
  if (UNTRACKED.test(url.pathname)) return null;
  const campaign = new URLSearchParams([...url.searchParams].filter(([key]) => key.startsWith("utm_"))).toString();
  return { ...event, url: `${url.origin}${url.pathname}${campaign ? `?${campaign}` : ""}` };
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <OrdersProvider>
          <ProductsProvider>
            <CartProvider>
              <App />
              <Analytics beforeSend={beforeSend} />
            </CartProvider>
          </ProductsProvider>
        </OrdersProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
