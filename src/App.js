import React, { useState, useCallback, useEffect, lazy, Suspense } from "react";
import NavbarOptimized from "./components/NavbarOptimized";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import CartDrawer from "./components/CartDrawer";
import { useAuth } from "./context/AuthContext";

// Heavy pages — code-split so they only load when navigated to
const PerfumesPage       = lazy(() => import("./pages/PerfumesPage"));
const AboutPage          = lazy(() => import("./pages/AboutPage"));
const CheckoutPage       = lazy(() => import("./pages/CheckoutPage"));
const OrdersPage         = lazy(() => import("./pages/OrdersPage"));
const AdminPage          = lazy(() => import("./pages/AdminPage"));
const LoginPage          = lazy(() => import("./pages/LoginPage"));
const PrivacyPolicyPage  = lazy(() => import("./pages/PrivacyPolicyPage"));
const RefundPolicyPage   = lazy(() => import("./pages/RefundPolicyPage"));
const ShippingPolicyPage = lazy(() => import("./pages/ShippingPolicyPage"));
const TermsPage          = lazy(() => import("./pages/TermsPage"));

const PAGE_PATH_MAP = {
  home:             "/",
  perfumes:         "/perfumes",
  about:            "/about",
  checkout:         "/checkout",
  orders:           "/orders",
  admin:            "/admin",
  "privacy-policy": "/privacy-policy",
  "refund-policy":  "/refund-return-policy",
  "shipping-policy":"/shipping-policy",
  terms:            "/terms-conditions",
};

const PAGE_PATH_ALIASES = {
  "/refund-policy": "refund-policy",
  "/terms":         "terms",
};

// Per-page SEO metadata
const PAGE_META = {
  home: {
    title: "SAHUMäRIO — Authentic Oil-Based Perfumes",
    description: "Discover SAHUMäRIO's collection of authentic, long-lasting oil-based perfumes. Handcrafted fragrances that tell your story.",
  },
  perfumes: {
    title: "Our Perfume Collection — SAHUMäRIO",
    description: "Browse our full range of authentic oil-based perfumes. Each bottle crafted with the finest natural ingredients for a rich, long-lasting fragrance.",
  },
  about: {
    title: "About Us — SAHUMäRIO",
    description: "Learn about SAHUMäRIO's founders and our mission to bring authentic, handcrafted oil-based perfumes to discerning customers.",
  },
  checkout: {
    title: "Checkout — SAHUMäRIO",
    description: "Complete your order securely. Fast delivery across India.",
  },
  orders: {
    title: "Your Orders — SAHUMäRIO",
    description: "View your past orders from SAHUMäRIO.",
  },
  "privacy-policy": {
    title: "Privacy Policy — SAHUMäRIO",
    description: "How SAHUMäRIO collects, uses, and protects your personal information.",
  },
  "refund-policy": {
    title: "Refund & Return Policy — SAHUMäRIO",
    description: "SAHUMäRIO's refund, return, and cancellation policy.",
  },
  "shipping-policy": {
    title: "Shipping Policy — SAHUMäRIO",
    description: "Shipping timelines, delivery information, and charges for SAHUMäRIO orders.",
  },
  terms: {
    title: "Terms & Conditions — SAHUMäRIO",
    description: "The terms and conditions governing use of the SAHUMäRIO website.",
  },
};

// Update <title> and <meta name="description"> for each page
function usePageMeta(page) {
  useEffect(() => {
    const meta = PAGE_META[page] || PAGE_META.home;
    document.title = meta.title;
    const el = document.querySelector('meta[name="description"]');
    if (el) el.setAttribute("content", meta.description);
  }, [page]);
}

// Lightweight page-transition skeleton
function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 animate-pulse" aria-hidden="true">
      <div className="h-8 w-48 rounded-lg bg-[var(--color-surface-muted)] mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-[var(--color-surface-muted)] aspect-[4/5]" />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading } = useAuth();

  const getPageFromPath = useCallback((pathname = "/") => {
    const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
    if (PAGE_PATH_ALIASES[normalizedPath]) return PAGE_PATH_ALIASES[normalizedPath];
    const matchedPage = Object.entries(PAGE_PATH_MAP).find(([, path]) => path === normalizedPath);
    return matchedPage?.[0] || "home";
  }, []);

  const [currentPage, setCurrentPage] = useState(() => getPageFromPath(window.location.pathname));
  const [showCart, setShowCart]       = useState(false);
  const [isMenuOpen, setIsMenuOpen]   = useState(false);

  usePageMeta(currentPage);

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
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleCartClick = useCallback(() => setShowCart(true), []);

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
            <Suspense fallback={<PageSkeleton />}>
              <PerfumesPage />
            </Suspense>
          </>
        );
      case "perfumes":
        return (
          <Suspense fallback={<PageSkeleton />}>
            <PerfumesPage />
          </Suspense>
        );
      case "about":
        return (
          <Suspense fallback={<PageSkeleton />}>
            <AboutPage />
          </Suspense>
        );
      case "checkout":
        return (
          <Suspense fallback={<PageSkeleton />}>
            <CheckoutPage setCurrentPage={handleSetCurrentPage} />
          </Suspense>
        );
      case "orders":
        return (
          <Suspense fallback={<PageSkeleton />}>
            <OrdersPage />
          </Suspense>
        );
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
            <Suspense fallback={<PageSkeleton />}>
              <LoginPage setCurrentPage={handleSetCurrentPage} redirectAfterLogin="admin" />
            </Suspense>
          );
        }
        return (
          <Suspense fallback={<PageSkeleton />}>
            <AdminPage setCurrentPage={handleSetCurrentPage} />
          </Suspense>
        );
      case "privacy-policy":
        return <Suspense fallback={<PageSkeleton />}><PrivacyPolicyPage /></Suspense>;
      case "refund-policy":
        return <Suspense fallback={<PageSkeleton />}><RefundPolicyPage /></Suspense>;
      case "shipping-policy":
        return <Suspense fallback={<PageSkeleton />}><ShippingPolicyPage /></Suspense>;
      case "terms":
        return <Suspense fallback={<PageSkeleton />}><TermsPage /></Suspense>;
      default:
        return <Suspense fallback={<PageSkeleton />}><PerfumesPage /></Suspense>;
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

      <main className="flex-1" id="main-content">
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
