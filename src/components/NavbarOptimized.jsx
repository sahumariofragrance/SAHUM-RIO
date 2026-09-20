import React, { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X, ShoppingBag, User, LogOut, Package, ShieldCheck } from "lucide-react";
import { useCart } from "../context/cartContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const NavButton = ({ id, active, onClick, children }) => (
  <button
    onClick={() => onClick(id)}
    className={`relative px-3 py-2 text-sm font-medium transition ${active ? "text-amber-700" : "text-[var(--color-text)] hover:text-amber-700"}`}
  >
    {children}
    {active && <span className="absolute inset-x-3 -bottom-0.5 h-px bg-amber-700" />}
  </button>
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
      <div className="bg-[#24160f] px-4 py-2 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-[#fff8ed]">
        SAHUMäRIO · OIL-BASED FRAGRANCE
      </div>
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[color:var(--color-bg)]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid h-20 grid-cols-[auto_1fr_auto] items-center">
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen?.(!isMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <nav className="hidden items-center gap-1 md:flex">
              <NavButton id="home" active={currentPage === "home"} onClick={nav}>Home</NavButton>
              <NavButton id="perfumes" active={currentPage === "perfumes" || currentPage === "product"} onClick={nav}>Perfumes</NavButton>
              <NavButton id="about" active={currentPage === "about"} onClick={nav}>About</NavButton>
            </nav>

            <button
              onClick={() => nav("home")}
              className="justify-self-center text-center"
              aria-label="SAHUMäRIO home"
            >
              <span className="block font-serif text-2xl font-semibold tracking-[0.08em]">
                SAHUMäRIO<sup className="ml-0.5 align-super text-[0.38em] font-sans font-semibold tracking-normal">®</sup>
              </span>
              <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">Fragrance</span>
            </button>

            <div className="flex items-center justify-end gap-1">
              <button
                onClick={toggleTheme}
                className="hidden rounded-full p-2.5 text-sm hover:bg-[var(--color-surface)] sm:block"
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? "☾" : "☀"}
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  className="rounded-full p-2.5 hover:bg-[var(--color-surface)]"
                  title={permanentUser ? user.email : "Login / Sign Up"}
                  onClick={() => permanentUser ? setDropdownOpen((v) => !v) : nav("login")}
                  aria-label={permanentUser ? "My Account" : "Login or Sign Up"}
                >
                  <User className="h-5 w-5" />
                </button>

                {permanentUser && dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl">
                    <div className="border-b border-[var(--color-border)] px-4 py-3">
                      <p className="text-xs text-[var(--color-muted)]">Signed in as</p>
                      <p className="mt-0.5 truncate text-sm font-semibold">{user.user_metadata?.name || user.email}</p>
                    </div>
                    <button onClick={() => nav("account")} className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-[var(--color-surface)]"><User className="h-4 w-4" />My Account</button>
                    <button onClick={() => nav("orders")} className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-[var(--color-surface)]"><Package className="h-4 w-4" />My Orders</button>
                    {isAdmin && <button onClick={() => nav("admin")} className="flex w-full items-center gap-2 px-4 py-3 text-sm text-amber-700 hover:bg-[var(--color-surface)]"><ShieldCheck className="h-4 w-4" />Admin Dashboard</button>}
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-[var(--color-surface)]"><LogOut className="h-4 w-4" />Log Out</button>
                  </div>
                )}
              </div>

              <button
                className="relative rounded-full p-2.5 hover:bg-[var(--color-surface)]"
                title="Cart"
                onClick={() => nav("cart")}
                aria-label={`Shopping cart with ${count} items`}
              >
                <ShoppingBag className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-700 px-1 text-[10px] font-semibold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <nav className="border-t border-[var(--color-border)] py-3 md:hidden">
              <button onClick={() => nav("home")} className="block w-full px-2 py-3 text-left text-sm">Home</button>
              <button onClick={() => nav("perfumes")} className="block w-full px-2 py-3 text-left text-sm">Perfumes</button>
              <button onClick={() => nav("about")} className="block w-full px-2 py-3 text-left text-sm">About</button>
              <button onClick={() => nav("cart")} className="block w-full px-2 py-3 text-left text-sm">Cart ({count})</button>
              {permanentUser ? (
                <>
                  <button onClick={() => nav("account")} className="block w-full px-2 py-3 text-left text-sm">My Account</button>
                  <button onClick={() => nav("orders")} className="block w-full px-2 py-3 text-left text-sm">My Orders</button>
                  {isAdmin && <button onClick={() => nav("admin")} className="block w-full px-2 py-3 text-left text-sm text-amber-700">Admin Dashboard</button>}
                  <button onClick={handleLogout} className="block w-full px-2 py-3 text-left text-sm text-red-600">Log Out</button>
                </>
              ) : (
                <button onClick={() => nav("login")} className="block w-full px-2 py-3 text-left text-sm">Login / Sign Up</button>
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
