import React from 'react';
import { RouterLink, useRouter } from '../router';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/cartContext';
import { useTheme } from '../context/ThemeContext';

const navLinkClass = (isActive) =>
  `${isActive ? 'text-amber-600' : 'text-[var(--color-muted)]'} hover:text-amber-600 transition px-3 py-2`;

const NavbarOptimized = React.memo(({ onCartClick, isMenuOpen, setIsMenuOpen }) => {
  const { pathname } = useRouter();
  const { count } = useCart();
  const { theme, toggleTheme } = useTheme();

  const closeMenu = () => setIsMenuOpen?.(false);

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-surface)]/90 backdrop-blur border-b border-[var(--color-border)] transition-colors duration-200">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          <RouterLink to="/" onClick={closeMenu} className="flex items-center text-xl font-bold tracking-wide hover:opacity-80 transition">
            <img src="/logo.png" alt="Sahumario Logo" width={70} height={70} loading="lazy" />
            <span className="text-amber-600">SAHUMä</span>RIO
          </RouterLink>

          <nav className="hidden md:flex items-center gap-1">
            <RouterLink to="/" className={navLinkClass(pathname === "/")}>Home</RouterLink>
            <RouterLink to="/perfumes" className={navLinkClass(pathname === "/perfumes")}>Perfumes</RouterLink>
            <RouterLink to="/about" className={navLinkClass(pathname === "/about")}>About</RouterLink>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--color-surface-muted)] transition"
              title="Toggle theme"
              type="button"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? '🌞' : '🌙'}
            </button>

            <button
              className="relative p-2 rounded-full hover:bg-[var(--color-surface-muted)] transition"
              title="Cart"
              type="button"
              onClick={onCartClick}
              aria-label={`Shopping cart with ${count} items`}
            >
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-semibold">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-[var(--color-surface-muted)] transition"
            onClick={() => setIsMenuOpen?.(!isMenuOpen)}
            aria-label="Toggle Menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            type="button"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <nav id="mobile-nav" className="md:hidden pb-3 animate-in fade-in duration-200">
            <div className="flex flex-col gap-1 border-t border-[var(--color-border)] pt-3">
              <RouterLink to="/" onClick={closeMenu} className="block w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-muted)] transition">Home</RouterLink>
              <RouterLink to="/perfumes" onClick={closeMenu} className="block w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-muted)] transition">Perfumes</RouterLink>
              <RouterLink to="/about" onClick={closeMenu} className="block w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-muted)] transition">About</RouterLink>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
});

NavbarOptimized.displayName = 'NavbarOptimized';

export default NavbarOptimized;
