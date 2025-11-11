import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import PerfumesPage from "./pages/PerfumesPage";
import AboutPage from "./pages/AboutPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import CartDrawer from "./components/CartDrawer";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [showCart, setShowCart] = useState(false);

  const goCheckout = () => {
    setShowCart(false);
    setCurrentPage("checkout");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onCartClick={() => setShowCart(true)}
      />

      <main className="flex-1">
        {currentPage === "home" && (
          <>
            <Hero onExplore={() => setCurrentPage("perfumes")} />
            <PerfumesPage />
          </>
        )}
        {currentPage === "perfumes" && <PerfumesPage />}
        {currentPage === "about" && <AboutPage />}
        {currentPage === "checkout" && <CheckoutPage setCurrentPage={setCurrentPage} />}
        {currentPage === "orders" && <OrdersPage />}
      </main>
      {/* <PerfumesPage /> */}
      <Footer setCurrentPage={setCurrentPage} />

      <CartDrawer
        open={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={goCheckout}
      />
    </div>
  );
}
