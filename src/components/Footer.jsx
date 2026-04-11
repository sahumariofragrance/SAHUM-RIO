import React from "react";
import { RouterLink } from "../router";

const Footer = React.memo(() => {
  return (
    <footer className="mt-12 border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-6xl px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
        <div>
          <RouterLink to="/" className="text-left hover:opacity-80 transition inline-block">
            <h4 className="text-lg font-semibold">SAHUMäRIO</h4>
          </RouterLink>
          <p className="mt-2 text-[var(--color-muted)]">Authentic oil-based perfumes that last all day.</p>
        </div>

        <div>
          <h5 className="font-medium">Quick Links</h5>
          <ul className="mt-2 space-y-1 text-[var(--color-muted)]">
            <li><RouterLink to="/" className="hover:text-amber-600 transition-colors">Home</RouterLink></li>
            <li><RouterLink to="/perfumes" className="hover:text-amber-600 transition-colors">Perfumes</RouterLink></li>
            <li><RouterLink to="/about" className="hover:text-amber-600 transition-colors">About</RouterLink></li>
            <li><a href="mailto:sahumariofragnance@gmail.com" className="hover:text-amber-600 transition-colors">Contact</a></li>
            {process.env.REACT_APP_ADMIN_ENABLED === "true" && (
              <li><RouterLink to="/admin" className="hover:text-amber-600 transition-colors">Admin</RouterLink></li>
            )}
          </ul>
        </div>

        <div>
          <h5 className="font-medium">Policies</h5>
          <ul className="mt-2 space-y-1 text-[var(--color-muted)]">
            <li><RouterLink to="/privacy-policy" className="hover:text-amber-600 transition-colors">Privacy Policy</RouterLink></li>
            <li><RouterLink to="/refund-policy" className="hover:text-amber-600 transition-colors">Refund &amp; Return Policy</RouterLink></li>
            <li><RouterLink to="/shipping-policy" className="hover:text-amber-600 transition-colors">Shipping Policy</RouterLink></li>
            <li><RouterLink to="/terms-and-conditions" className="hover:text-amber-600 transition-colors">Terms &amp; Conditions</RouterLink></li>
          </ul>
        </div>

        <div>
          <h5 className="font-medium">Connect</h5>
          <p className="mt-2 text-[var(--color-muted)]">Email: <a href="mailto:sahumariofragnance@gmail.com" className="hover:text-amber-600 transition-colors">sahumariofragnance@gmail.com</a></p>
          <p className="text-[var(--color-muted)]">Phone: <a href="tel:+919974599911" className="hover:text-amber-600 transition-colors">+91 9974599911</a></p>
          <p className="mt-4 text-[var(--color-muted)]">© 2025 SAHUMäRIO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
