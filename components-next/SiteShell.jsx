"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";
import BrandMark from "../src/components/BrandMark";
import { CartProvider, useCart } from "./cart";
import { ThemeProvider, useTheme } from "./theme";

function Navbar() {
  const { count } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), []);

  return (
    <>
      <div className="border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        Complimentary delivery across India
      </div>
      <header className="glass-surface sticky top-0 z-40 border-b">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-10">
          <div className="grid h-[76px] grid-cols-[1fr_auto_1fr] items-center">
            <div className="flex items-center">
              <button className="md:hidden" onClick={() => setOpen(v => !v)} aria-label="Toggle menu">
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <nav className="hidden items-center gap-7 md:flex">
                <Link href="/" className="py-2 text-[10px] font-semibold uppercase tracking-[0.18em] opacity-75 transition hover:opacity-100">Home</Link>
                <Link href="/perfumes" className="py-2 text-[10px] font-semibold uppercase tracking-[0.18em] opacity-75 transition hover:opacity-100">Perfumes</Link>
                <Link href="/about" className="py-2 text-[10px] font-semibold uppercase tracking-[0.18em] opacity-75 transition hover:opacity-100">The House</Link>
              </nav>
            </div>

            <Link href="/" className="justify-self-center px-4 text-center" aria-label="SAHUMäRIO home">
              <BrandMark className="block font-serif text-[27px] font-medium leading-none tracking-[0.075em]" />
            </Link>

            <div className="flex items-center justify-end gap-0.5">
              <button onClick={toggleTheme} className="hidden p-2.5 text-sm opacity-70 transition hover:opacity-100 sm:block" aria-label="Toggle theme">
                {theme === "light" ? "☾" : "☀"}
              </button>
              <Link href="/cart" className="relative p-2.5" aria-label="Cart">
                <ShoppingBag className="h-5 w-5" />
                {count > 0 && <span className="absolute right-1 top-1 min-w-4 rounded-full bg-[var(--color-text)] px-1 text-center text-[9px] text-[var(--color-bg)]">{count}</span>}
              </Link>
            </div>
          </div>

          {open && (
            <nav className="border-t border-[var(--color-border)] py-4 md:hidden">
              <div className="flex flex-col gap-3 text-[10px] font-semibold uppercase tracking-[0.18em]">
                <Link href="/" onClick={() => setOpen(false)}>Home</Link>
                <Link href="/perfumes" onClick={() => setOpen(false)}>Perfumes</Link>
                <Link href="/about" onClick={() => setOpen(false)}>The House</Link>
                <Link href="/bulk-orders" onClick={() => setOpen(false)}>Bulk Orders</Link>
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  );
}

function Footer() {
  return (
    <footer className="bg-[#11110f] text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 md:px-12 md:py-20">
        <Link href="/" className="block text-left">
          <BrandMark className="font-serif text-[clamp(2.5rem,5.25vw,5.25rem)] font-normal leading-[0.95] tracking-[-0.018em]" registeredClassName="!ml-[0.1em] !text-[0.27em] !font-normal" />
        </Link>
        <div className="mt-14 grid gap-12 border-t border-white/15 pt-10 md:grid-cols-[1.4fr_0.7fr_1fr_1fr]">
          <p className="max-w-sm text-sm leading-7 text-white/60">An independent Eau de Parfum collection built around distinct moods, names, and visual identities.</p>
          <div><h3 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">Shop</h3><div className="mt-5 space-y-3 text-sm text-white/65"><p><Link href="/perfumes">All Perfumes</Link></p><p><Link href="/cart">Cart</Link></p></div></div>
          <div><h3 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">Information</h3><div className="mt-5 space-y-3 text-sm text-white/65"><p><Link href="/about">About</Link></p><p><Link href="/bulk-orders">Bulk Orders & Corporate Gifting</Link></p><p><a href="https://sahumario.com/shipping-policy">Shipping Policy</a></p><p><a href="https://sahumario.com/refund-return-policy">Refund & Return Policy</a></p></div></div>
          <div><h3 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">Contact</h3><div className="mt-5 space-y-3 text-sm text-white/65"><p><a href="mailto:sahumariofragrance@gmail.com">sahumariofragrance@gmail.com</a></p><p><a href="tel:+919974599910">+91 99745 99910</a></p></div></div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/15 pt-6 text-[10px] uppercase tracking-[0.14em] text-white/35 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 SAHUMäRIO®. All rights reserved.</p><p>Fragrance · India</p></div>
      </div>
    </footer>
  );
}

function Shell({ children }) {
  return <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]"><Navbar /><main className="flex-1">{children}</main><Footer /></div>;
}

export default function SiteShell({ children }) {
  return <ThemeProvider><CartProvider><Shell>{children}</Shell></CartProvider></ThemeProvider>;
}
