import React, { useState, useCallback, useEffect } from "react";
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
import CartDrawer from "./components/CartDrawer";
import { useAuth } from "./context/AuthContext";

const PAGE_PATH_MAP = {
  home: "/",
  perfumes: "/perfumes",
  about: "/about",
  checkout: "/checkout",
  orders: "/orders",
  admin: "/admin",
  "privacy-policy": "/privacy-policy",
  "refund-policy": "/refund-return-policy",
  "shipping-policy": "/shipping-policy",
  terms: "/terms-conditions",
};

const PAGE_PATH_ALIASES = {
  "/refund-policy": "refund-policy",
  "/terms": "terms",
};

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const getPageFromPath = useCallback((pathname = "/") => {
    const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
    if (PAGE_PATH_ALIASES[normalizedPath]) {
      return PAGE_PATH_ALIASES[normalizedPath];
    }
    const matchedPage = Object.entries(PAGE_PATH_MAP).find(
      ([, path]) => path === normalizedPath
    );
    return matchedPage?.[0] || "home";
  }, []);

  const [currentPage, setCurrentPage] = useState(() =>
    getPageFromPath(window.location.pathname)
  );
  const [showCart, setShowCart] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const goCheckout = useCallback(() => {
    setShowCart(false);
    setCurrentPage("checkout");
  }, []);

  const handleSetCurrentPage = useCallback((page) => {
    setCurrentPage(page);
    setIsMenuOpen(false);

    const targetPath = PAGE_PATH_MAP[page] || "/";
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, "", targetPath);
    }
  }, []);

  const handleCartClick = useCallback(() => {
    setShowCart(true);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromPath(window.location.pathname));
      setIsMenuOpen(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [getPageFromPath]);

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <>
            <Hero onExplore={() => handleSetCurrentPage("perfumes")} />
            <PerfumesPage />
          </>
        );
      case "perfumes":
        return <PerfumesPage />;
      case "about":
        return <AboutPage />;
      case "checkout":
        return <CheckoutPage setCurrentPage={handleSetCurrentPage} />;
      case "orders":
        return <OrdersPage />;
      case "admin":
        if (authLoading) {
          return (
            <div className="flex justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
            </div>
          );
        }
        if (!user) {
          return (
            <LoginPage
              setCurrentPage={handleSetCurrentPage}
              redirectAfterLogin="admin"
            />
          );
        }
        return <AdminPage setCurrentPage={handleSetCurrentPage} />;
      case "privacy-policy":
        return <PrivacyPolicyPage />;
      case "refund-policy":
        return <RefundPolicyPage />;
      case "shipping-policy":
        return <ShippingPolicyPage />;
      case "terms":
        return <TermsPage />;
      default:
        return <PerfumesPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-200">
      <NavbarOptimized
        currentPage={currentPage}
        setCurrentPage={handleSetCurrentPage}
        onCartClick={handleCartClick}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      <main className="flex-1">
        {renderPage()}
      </main>

      <Footer setCurrentPage={handleSetCurrentPage} />

      <CartDrawer
        open={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={goCheckout}
      />
    </div>
  );
}
