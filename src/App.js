import React, { useState, useCallback, useMemo } from "react";
import NavbarOptimized from "./components/NavbarOptimized";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import PerfumesPage from "./pages/PerfumesPage";
import AboutPage from "./pages/AboutPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import ShippingPolicyPage from "./pages/ShippingPolicyPage";
import TermsPage from "./pages/TermsPage";
import NotFoundPage from "./pages/NotFoundPage";
import CartDrawer from "./components/CartDrawer";
import { useAuth } from "./context/AuthContext";
import { useRouter } from "./router";

function HomePage() {
  return (
    <>
      <Hero />
      <PerfumesPage />
    </>
  );
}

export default function App() {
  const { pathname, navigate } = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showCart, setShowCart] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const goCheckout = useCallback(() => {
    setShowCart(false);
    navigate("/checkout");
  }, [navigate]);

  const handleCartClick = useCallback(() => {
    setShowCart(true);
  }, []);

  const page = useMemo(() => {
    switch (pathname) {
      case "/":
        return <HomePage />;
      case "/perfumes":
        return <PerfumesPage />;
      case "/about":
        return <AboutPage />;
      case "/checkout":
        return <CheckoutPage />;
      case "/orders":
        return <OrdersPage />;
      case "/admin":
        if (authLoading) {
          return (
            <div className="flex justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
            </div>
          );
        }
        return user ? <AdminPage /> : <LoginPage redirectPath="/admin" />;
      case "/privacy-policy":
        return <PrivacyPolicyPage />;
      case "/refund-policy":
        return <RefundPolicyPage />;
      case "/shipping-policy":
        return <ShippingPolicyPage />;
      case "/terms":
      case "/terms-and-conditions":
        return <TermsPage />;
      default:
        return <NotFoundPage />;
    }
  }, [pathname, authLoading, user]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-200">
      <NavbarOptimized onCartClick={handleCartClick} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main className="flex-1" onClick={() => setIsMenuOpen(false)}>
        {page}
      </main>

      <Footer />

      <CartDrawer open={showCart} onClose={() => setShowCart(false)} onCheckout={goCheckout} />
    </div>
  );
}
