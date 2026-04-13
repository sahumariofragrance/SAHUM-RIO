import React, { useCallback } from "react";

const FooterLink = React.memo(({ onClick, href = "#", children }) => (
  <a
    href={href}
    onClick={(event) => {
      event.preventDefault();
      onClick?.();
    }}
    className="hover:text-amber-600 transition-colors"
  >
    {children}
  </a>
));

FooterLink.displayName = 'FooterLink';

const Footer = React.memo(({ setCurrentPage }) => {
  const handleNavClick = useCallback((page) => {
    setCurrentPage?.(page);
  }, [setCurrentPage]);

  const handleEmailClick = useCallback(() => {
    window.location.href = 'mailto:sahumariofragnance@gmail.com';
  }, []);

  return (
    <footer className="mt-12 border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-6xl px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
        {/* Column 1 — Brand */}
        <div>
          <button
            onClick={() => handleNavClick("home")}
            className="text-left hover:opacity-80 transition"
          >
            <h4 className="text-lg font-semibold">SAHUMäRIO</h4>
          </button>
          <p className="mt-2 text-[var(--color-muted)]">
            Authentic oil-based perfumes that last all day.
          </p>
        </div>

        {/* Column 2 — Quick Links */}
        <div>
          <h5 className="font-medium">Quick Links</h5>
          <ul className="mt-2 space-y-1 text-[var(--color-muted)]">
            <li>
              <FooterLink onClick={() => handleNavClick("home")}>Home</FooterLink>
            </li>
            <li>
              <FooterLink onClick={() => handleNavClick("perfumes")}>Perfumes</FooterLink>
            </li>
            <li>
              <FooterLink onClick={() => handleNavClick("about")}>About</FooterLink>
            </li>
            <li>
              <FooterLink onClick={handleEmailClick}>Contact</FooterLink>
            </li>
            {process.env.REACT_APP_ADMIN_ENABLED === "true" && (
              <li>
                <FooterLink onClick={() => handleNavClick("admin")}>Admin</FooterLink>
              </li>
            )}
          </ul>
        </div>

        {/* Column 3 — Policies */}
        <div>
          <h5 className="font-medium">Policies</h5>
          <ul className="mt-2 space-y-1 text-[var(--color-muted)]">
            <li>
              <FooterLink
                href="/privacy-policy"
                onClick={() => handleNavClick("privacy-policy")}
              >
                Privacy Policy
              </FooterLink>
            </li>
            <li>
              <FooterLink
                href="/refund-return-policy"
                onClick={() => handleNavClick("refund-policy")}
              >
                Refund &amp; Return Policy
              </FooterLink>
            </li>
            <li>
              <FooterLink
                href="/shipping-policy"
                onClick={() => handleNavClick("shipping-policy")}
              >
                Shipping Policy
              </FooterLink>
            </li>
            <li>
              <FooterLink
                href="/terms-conditions"
                onClick={() => handleNavClick("terms")}
              >
                Terms &amp; Conditions
              </FooterLink>
            </li>
          </ul>
        </div>

        {/* Column 4 — Connect */}
        <div>
          <h5 className="font-medium">Connect</h5>
          <p className="mt-2 text-[var(--color-muted)]">
            Email:{" "}
            <a
              href="mailto:sahumariofragnance@gmail.com"
              className="hover:text-amber-600 transition-colors"
            >
              sahumariofragnance@gmail.com
            </a>
          </p>
          <p className="text-[var(--color-muted)]">
            Phone:{" "}
            <a href="tel:+919974599911" className="hover:text-amber-600 transition-colors">
              +91 9974599911
            </a>
          </p>
          <p className="mt-4 text-[var(--color-muted)]">© 2025 SAHUMäRIO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
