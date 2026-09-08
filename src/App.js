import React, { useState, useCallback, useEffect, lazy, Suspense } from "react";
import NavbarOptimized from "./components/NavbarOptimized";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import CartDrawer from "./components/CartDrawer";
import { useAuth } from "./context/AuthContext";

const PerfumesPage       = lazy(() => import("./pages/PerfumesPage"));
const AboutPage          = lazy(() => import("./pages/AboutPage"));
const CheckoutPage       = lazy(() => import("./pages/CheckoutPage"));
const OrdersPage         = lazy(() => import("./pages/OrdersPage"));
const AdminPage          = lazy(() => import("./pages/AdminPage"));
const LoginPage          = lazy(() => import("./pages/LoginPage"));
const ResetPasswordPage  = lazy(() => import("./pages/ResetPasswordPage"));
const PrivacyPolicyPage  = lazy(() => import("./pages/PrivacyPolicyPage"));
const RefundPolicyPage   = lazy(() => import("./pages/RefundPolicyPage"));
const ShippingPolicyPage = lazy(() => import("./pages/ShippingPolicyPage"));
const TermsPage          = lazy(() => import("./pages/TermsPage"));

const PAGE_PATH_MAP = {
  home: "/",
  perfumes: "/perfumes",
  about: "/about",
  checkout: "/checkout",
  orders: "/orders",
  admin: "/admin",
  login: "/login",
  "reset-password": "/reset-password",
  "privacy-policy": "/privacy-policy",
  "refund-policy": "/refund-return-policy",
  "shipping-policy": "/shipping-policy",
  terms: "/terms-conditions",
};

const PAGE_PATH_ALIASES = { "/refund-policy": "refund-policy", "/terms": "terms" };

const PAGE_META = {
  home: { title: "SAHUMäRIO — Authentic Oil-Based Perfumes", description: "Discover SAHUMäRIO's collection of authentic, long-lasting oil-based perfumes." },
  perfumes: { title: "Our Perfume Collection — SAHUMäRIO", description: "Browse our full range of authentic oil-based perfumes." },
  about: { title: "About Us — SAHUMäRIO", description: "Learn about SAHUMäRIO and our fragrances." },
  checkout: { title: "Checkout — SAHUMäRIO", description: "Complete your order securely." },
  orders: { title: "Your Orders — SAHUMäRIO", description: "View your SAHUMäRIO orders." },
  admin: { title: "Admin — SAHUMäRIO", description: "SAHUMäRIO order administration." },
  login: { title: "Log In or Sign Up — SAHUMäRIO", description: "Log in or create your SAHUMäRIO account." },
  "reset-password": { title: "Reset Password — SAHUMäRIO", description: "Choose a new password for your SAHUMäRIO account." },
  "privacy-policy": { title: "Privacy Policy — SAHUMäRIO", description: "How SAHUMäRIO protects your information." },
  "refund-policy": { title: "Refund & Return Policy — SAHUMäRIO", description: "SAHUMäRIO refund and return policy." },
  "shipping-policy": { title: "Shipping Policy — SAHUMäRIO", description: "SAHUMäRIO shipping information." },
  terms: { title: "Terms & Conditions — SAHUMäRIO", description: "SAHUMäRIO terms and conditions." },
};

function usePageMeta(page) {
  useEffect(() => {
    const meta = PAGE_META[page] || PAGE_META.home;
    document.title = meta.title;
    const el = document.querySelector('meta[name="description"]');
    if (el) el.setAttribute("content", meta.description);
  }, [page]);
}

function PageSkeleton() {
  return <div className="mx-auto max-w-6xl px-4 py-16 animate-pulse" aria-hidden="true"><div className="h-8 w-48 rounded-lg bg-[var(--color-surface-muted)] mb-8" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="rounded-xl bg-[var(--color-surface-muted)] aspect-[4/5]" />)}</div></div>;
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const getPageFromPath = useCallback((pathname = "/") => {
    const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
    if (PAGE_PATH_ALIASES[normalizedPath]) return PAGE_PATH_ALIASES[normalizedPath];
    return Object.entries(PAGE_PATH_MAP).find(([, path]) => path === normalizedPath)?.[0] || "home";
  }, []);

  const [currentPage, setCurrentPage] = useState(() => getPageFromPath(window.location.pathname));
  const [showCart, setShowCart] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  usePageMeta(currentPage);

  const handleSetCurrentPage = useCallback((page) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
    const targetPath = PAGE_PATH_MAP[page] || "/";
    if (window.location.pathname !== targetPath) window.history.pushState({}, "", targetPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handlePopState = () => { setCurrentPage(getPageFromPath(window.location.pathname)); setIsMenuOpen(false); };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [getPageFromPath]);

  const page = (() => {
    switch (currentPage) {
      case "home": return <><Hero onExplore={() => handleSetCurrentPage("perfumes")} /><PerfumesPage /></>;
      case "perfumes": return <PerfumesPage />;
      case "about": return <AboutPage />;
      case "checkout": return <CheckoutPage setCurrentPage={handleSetCurrentPage} />;
      case "orders": return <OrdersPage setCurrentPage={handleSetCurrentPage} />;
      case "reset-password": return <ResetPasswordPage setCurrentPage={handleSetCurrentPage} />;
      case "admin":
        if (authLoading) return <div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" /></div>;
        if (!user) return <LoginPage setCurrentPage={handleSetCurrentPage} redirectAfterLogin="admin" />;
        if (user.email !== "sahumariofragrance@gmail.com") return <section className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">Access denied</h1><p className="mt-3 text-[var(--color-muted)]">This account does not have administrator access.</p></section>;
        return <AdminPage setCurrentPage={handleSetCurrentPage} />;
      case "login": return user ? <OrdersPage setCurrentPage={handleSetCurrentPage} /> : <LoginPage setCurrentPage={handleSetCurrentPage} redirectAfterLogin="home" />;
      case "privacy-policy": return <PrivacyPolicyPage />;
      case "refund-policy": return <RefundPolicyPage />;
      case "shipping-policy": return <ShippingPolicyPage />;
      case "terms": return <TermsPage />;
      default: return <PerfumesPage />;
    }
  })();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-200">
      <NavbarOptimized currentPage={currentPage} setCurrentPage={handleSetCurrentPage} onCartClick={() => setShowCart(true)} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <main className="flex-1" id="main-content"><Suspense fallback={<PageSkeleton />}>{page}</Suspense></main>
      <Footer setCurrentPage={handleSetCurrentPage} />
      <CartDrawer open={showCart} onClose={() => setShowCart(false)} onCheckout={() => { setShowCart(false); handleSetCurrentPage("checkout"); }} />
    </div>
  );
}
