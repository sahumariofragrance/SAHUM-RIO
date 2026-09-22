import React, { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X, ShoppingBag, User, LogOut, Package, ShieldCheck } from "lucide-react";
import { useCart } from "../context/cartContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import BrandMark from "./BrandMark";
import SpaLink from "./SpaLink";

const PAGE_HREFS = {
  home: "/",
  perfumes: "/perfumes",
  about: "/about",
  cart: "/cart",
  account: "/account",
  orders: "/account/orders",
  admin: "/admin",
  login: "/login",
};

const NavLink = ({ id, active, onNavigate, children, className = "" }) => (
  <SpaLink
    href={PAGE_HREFS[id] || "/"}
    onNavigate={() => onNavigate(id)}
    className={"relative py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition-opacity hover:opacity-55 " + (active ? "opacity-100 " : "opacity-75 ") + className}
  >
    {children}
    {active && <span className="absolute inset-x-0 -bottom-0.5 h-px bg-[var(--color-text)]" />}
  </SpaLink>
);

const NavbarOptimized = React.memo(({ currentPage, setCurrentPage, isMenuOpen, setIsMenuOpen }) => {
  const { count } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isGuest } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const dropdownRef = useRef(null);

  const nav = useCallback((page) => {
    setCurrentPage?.(page);
    setIsMenuOpen?.(false);
    setDropdownOpen(false);
  }, [setCurrentPage, setIsMenuOpen]);

  const handleLogout = useCallback(async () => {
    setDropdownOpen(false);
    setIsMenuOpen?.(false);
    await logout();
    setCurrentPage?.("home");
  }, [logout, setCurrentPage, setIsMenuOpen]);

  useEffect(() => {
    let live = true;
    if (!user || isGuest) {
      setIsAdmin(false);
      return () => { live = false; };
    }
    supabase.rpc("is_admin").then(({ data, error }) => {
      if (live) setIsAdmin(!error && data === true);
    });
    return () => { live = false; };
  }, [user, isGuest]);

  useEffect(() => {
    const outside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const permanentUser = user && !isGuest;

  return (
    <>
      <div className="border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        Complimentary delivery across India
      </div>

      <header className="glass-surface sticky top-0 z-40 border-b">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-10">
          <div className="grid h-[76px] grid-cols-[1fr_auto_1fr] items-center">
            <div className="flex items-center">
              <button
                className="md:hidden"
                onClick={() => setIsMenuOpen?.(!isMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <nav className="hidden items-center gap-7 md:flex">
                <NavLink id="home" active={currentPage === "home"} onNavigate={nav}>Home</NavLink>
                <NavLink id="perfumes" active={currentPage === "perfumes" || currentPage === "product"} onNavigate={nav}>Perfumes</NavLink>
                <NavLink id="about" active={currentPage === "about"} onNavigate={nav}>The House</NavLink>
              </nav>
            </div>

            <SpaLink href="/" onNavigate={() => nav("home")} className="justify-self-center px-4 text-center" aria-label="SAHUMäRIO registered trademark home">
              <BrandMark className="block font-serif text-[27px] font-medium leading-none tracking-[0.075em]" />
            </SpaLink>

            <div className="flex items-center justify-end gap-0.5">
              <button
                onClick={toggleTheme}
                className="hidden p-2.5 text-sm opacity-70 transition hover:opacity-100 sm:block"
                aria-label={"Switch to " + (theme === "light" ? "dark" : "light") + " mode"}
                title={"Switch to " + (theme === "light" ? "dark" : "light") + " mode"}
              >
                {theme === "light" ? "☾" : "☀"}
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  className="p-2.5 transition-opacity hover:opacity-55"
                  title={permanentUser ? user.email : "Login / Sign Up"}
                  onClick={() => permanentUser ? setDropdownOpen((v) => !v) : nav("login")}
                  aria-label={permanentUser ? "My Account" : "Login or Sign Up"}
                >
                  <User className="h-[18px] w-[18px]" strokeWidth={1.7} />
                </button>

                {permanentUser && dropdownOpen && (
                  <div className="glass-panel right-0 mt-3 w-60 overflow-hidden rounded-2xl" style={{ position: "absolute" }}>
                    <div className="border-b border-[var(--color-border)] px-4 py-3">
                      <p className="text-xs text-[var(--color-muted)]">Signed in as</p>
                      <p className="mt-0.5 truncate text-sm font-medium">{user.user_metadata?.name || user.email}</p>
                    </div>
                    <SpaLink href="/account" onNavigate={() => nav("account")} className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-[var(--color-surface)]"><User className="h-4 w-4" />My Account</SpaLink>
                    <SpaLink href="/account/orders" onNavigate={() => nav("orders")} className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-[var(--color-surface)]"><Package className="h-4 w-4" />My Orders</SpaLink>
                    {isAdmin && <SpaLink href="/admin" onNavigate={() => nav("admin")} className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-[var(--color-surface)]"><ShieldCheck className="h-4 w-4" />Admin Dashboard</SpaLink>}
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-[var(--color-surface)]"><LogOut className="h-4 w-4" />Log Out</button>
                  </div>
                )}
              </div>

              <SpaLink
                href="/cart"
                onNavigate={() => nav("cart")}
                className="relative p-2.5 transition-opacity hover:opacity-55"
                title="Cart"
                aria-label={"Shopping cart with " + count + " items"}
              >
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.7} />
                {count > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-text)] px-1 text-[8px] font-semibold text-[var(--color-bg)]">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </SpaLink>
            </div>
          </div>

          {isMenuOpen && (
            <nav className="glass-surface -mx-4 border-t px-4 py-3 sm:-mx-6 sm:px-6 md:hidden">
              <SpaLink href="/" onNavigate={() => nav("home")} className="block w-full px-1 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em]">Home</SpaLink>
              <SpaLink href="/perfumes" onNavigate={() => nav("perfumes")} className="block w-full px-1 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em]">Perfumes</SpaLink>
              <SpaLink href="/about" onNavigate={() => nav("about")} className="block w-full px-1 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em]">The House</SpaLink>
              <SpaLink href="/cart" onNavigate={() => nav("cart")} className="block w-full px-1 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em]">Cart ({count})</SpaLink>
              {permanentUser ? (
                <>
                  <SpaLink href="/account" onNavigate={() => nav("account")} className="block w-full px-1 py-3 text-left text-sm">My Account</SpaLink>
                  <SpaLink href="/account/orders" onNavigate={() => nav("orders")} className="block w-full px-1 py-3 text-left text-sm">My Orders</SpaLink>
                  {isAdmin && <SpaLink href="/admin" onNavigate={() => nav("admin")} className="block w-full px-1 py-3 text-left text-sm">Admin Dashboard</SpaLink>}
                  <button onClick={handleLogout} className="block w-full px-1 py-3 text-left text-sm text-red-600">Log Out</button>
                </>
              ) : (
                <SpaLink href="/login" onNavigate={() => nav("login")} className="block w-full px-1 py-3 text-left text-sm">Login / Sign Up</SpaLink>
              )}
            </nav>
          )}
        </div>
      </header>
    </>
  );
});

NavbarOptimized.displayName = "NavbarOptimized";
export default NavbarOptimized;
