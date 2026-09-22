import React, { useCallback } from "react";
import BrandMark from "./BrandMark";

const FooterLink = React.memo(({ onClick, href = "#", children }) => (
  <a
    href={href}
    onClick={(event) => {
      event.preventDefault();
      onClick?.();
    }}
    className="text-white/65 transition hover:text-white"
  >
    {children}
  </a>
));
FooterLink.displayName = "FooterLink";

const Footer = React.memo(({ setCurrentPage }) => {
  const nav = useCallback((page) => setCurrentPage?.(page), [setCurrentPage]);

  return (
    <footer className="bg-[#11110f] text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 md:px-12 md:py-20">
        <button onClick={() => nav("home")} className="text-left" aria-label="SAHUMäRIO registered trademark home">
          <BrandMark className="font-serif text-[clamp(3.8rem,9vw,9rem)] font-normal leading-none tracking-[-0.025em]" />
        </button>

        <div className="mt-14 grid gap-12 border-t border-white/15 pt-10 md:grid-cols-[1.4fr_0.7fr_1fr_1fr]">
          <div>
            <p className="max-w-sm text-sm leading-7 text-white/60">
              An independent Eau de Parfum collection built around distinct moods, names, and visual identities.
            </p>
          </div>

          <div>
            <h3 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">Shop</h3>
            <div className="mt-5 space-y-3 text-sm">
              <p><FooterLink onClick={() => nav("perfumes")}>All Perfumes</FooterLink></p>
              <p><FooterLink onClick={() => nav("cart")}>Cart</FooterLink></p>
              <p><FooterLink onClick={() => nav("account")}>My Account</FooterLink></p>
              <p><FooterLink onClick={() => nav("orders")}>My Orders</FooterLink></p>
            </div>
          </div>

          <div>
            <h3 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">Information</h3>
            <div className="mt-5 space-y-3 text-sm">
              <p><FooterLink onClick={() => nav("about")}>About</FooterLink></p>
              <p><FooterLink href="/bulk-orders" onClick={() => nav("bulk-orders")}>Bulk Orders & Corporate Gifting</FooterLink></p>
              <p><FooterLink href="/shipping-policy" onClick={() => nav("shipping-policy")}>Shipping Policy</FooterLink></p>
              <p><FooterLink href="/refund-return-policy" onClick={() => nav("refund-policy")}>Refund & Return Policy</FooterLink></p>
              <p><FooterLink href="/privacy-policy" onClick={() => nav("privacy-policy")}>Privacy Policy</FooterLink></p>
              <p><FooterLink href="/terms-conditions" onClick={() => nav("terms")}>Terms & Conditions</FooterLink></p>
            </div>
          </div>

          <div>
            <h3 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">Contact</h3>
            <div className="mt-5 space-y-3 text-sm text-white/65">
              <p><a href="mailto:sahumariofragrance@gmail.com" className="transition hover:text-white">sahumariofragrance@gmail.com</a></p>
              <p><a href="tel:+919974599910" className="transition hover:text-white">+91 99745 99910</a></p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/15 pt-6 text-[10px] uppercase tracking-[0.14em] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SAHUMäRIO®. All rights reserved.</p>
          <p>Fragrance · India</p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
export default Footer;
