import React, { useCallback } from "react";

const FooterLink = React.memo(({ onClick, href = "#", children }) => (
  <a
    href={href}
    onClick={(event) => {
      event.preventDefault();
      onClick?.();
    }}
    className="text-stone-300 transition hover:text-amber-300"
  >
    {children}
  </a>
));
FooterLink.displayName = "FooterLink";

const Footer = React.memo(({ setCurrentPage }) => {
  const nav = useCallback((page) => setCurrentPage?.(page), [setCurrentPage]);

  return (
    <footer className="mt-0 bg-[#24160f] text-[#fff8ed]">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_0.7fr_0.9fr_1fr]">
          <div>
            <button onClick={() => nav("home")} className="text-left">
              <p className="font-serif text-3xl font-semibold tracking-[0.08em]">SAHUMäRIO</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-stone-400">Fragrance</p>
            </button>
            <p className="mt-5 max-w-sm text-sm leading-7 text-stone-300">
              A growing collection of oil-based perfumes with distinct names, visual identities, and a focused point of view.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Shop</h3>
            <div className="mt-4 space-y-3 text-sm">
              <p><FooterLink onClick={() => nav("perfumes")}>All Perfumes</FooterLink></p>
              <p><FooterLink onClick={() => nav("cart")}>Cart</FooterLink></p>
              <p><FooterLink onClick={() => nav("account")}>My Account</FooterLink></p>
              <p><FooterLink onClick={() => nav("orders")}>My Orders</FooterLink></p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Information</h3>
            <div className="mt-4 space-y-3 text-sm">
              <p><FooterLink onClick={() => nav("about")}>About</FooterLink></p>
              <p><FooterLink href="/shipping-policy" onClick={() => nav("shipping-policy")}>Shipping Policy</FooterLink></p>
              <p><FooterLink href="/refund-return-policy" onClick={() => nav("refund-policy")}>Refund & Return Policy</FooterLink></p>
              <p><FooterLink href="/privacy-policy" onClick={() => nav("privacy-policy")}>Privacy Policy</FooterLink></p>
              <p><FooterLink href="/terms-conditions" onClick={() => nav("terms")}>Terms & Conditions</FooterLink></p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Contact</h3>
            <div className="mt-4 space-y-3 text-sm text-stone-300">
              <p><a href="mailto:sahumariofragrance@gmail.com" className="hover:text-amber-300">sahumariofragrance@gmail.com</a></p>
              <p><a href="tel:+919974599910" className="hover:text-amber-300">+91 99745 99910</a></p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SAHUMäRIO. All rights reserved.</p>
          <p>SAHUMäRIO Fragrance · India</p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
export default Footer;
