import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Menu, X, ShoppingCart, User, LogOut, Package } from 'lucide-react';
import { useCart } from '../context/cartContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const NavLink = React.memo(({ id, isActive, onClick, children }) => (
  <button
    onClick={() => onClick(id)}
    className={`${
      isActive ? 'text-amber-400' : 'text-stone-300'
    } hover:text-amber-400 transition-colors px-3 py-2 text-sm font-medium`}
    aria-current={isActive ? 'page' : undefined}
  >
    {children}
  </button>
));

NavLink.displayName = 'NavLink';

const NavbarOptimized = React.memo(({ 
  currentPage, 
  setCurrentPage, 
  onCartClick,
  isMenuOpen,
  setIsMenuOpen
}) => {
  const { count } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleNavClick = useCallback((page) => {
    setCurrentPage?.(page);
    setIsMenuOpen?.(false);
    setDropdownOpen(false);
  }, [setCurrentPage, setIsMenuOpen]);

  const handleLogout = useCallback(async () => {
    setDropdownOpen(false);
    setIsMenuOpen?.(false);
    await logout();
    setCurrentPage?.('home');
  }, [logout, setCurrentPage, setIsMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 transition-colors duration-200" style={{ backgroundColor: '#3b1708', borderBottom: '1px solid #7c2d12' }}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => handleNavClick('home')} 
            className="flex items-center text-xl font-bold tracking-wide hover:opacity-80 transition"
          >
            <img
              src="/logo.png"
              alt="Sahumario Logo"
              width={70}
              height={70}
              loading="eager"
              fetchpriority="high"
              decoding="sync"
              className="drop-shadow-sm"
            />
            <span className="text-amber-400">SAHUMä</span><span className="text-white">RIO</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink id="home" isActive={currentPage === 'home'} onClick={handleNavClick}>
              Home
            </NavLink>
            <NavLink id="perfumes" isActive={currentPage === 'perfumes'} onClick={handleNavClick}>
              Perfumes
            </NavLink>
            <NavLink id="about" isActive={currentPage === 'about'} onClick={handleNavClick}>
              About
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-stone-300 hover:text-white hover:bg-[#7c2d12] transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              type="button"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '🌞'}
            </button>

            {/* Account dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                className={`p-2 rounded-full transition-colors ${
                  dropdownOpen || currentPage === 'login' || currentPage === 'orders'
                    ? 'text-amber-400 bg-[#7c2d12]'
                    : 'text-stone-300 hover:text-white hover:bg-[#7c2d12]'
                }`}
                title={user ? user.email : "Login / Sign Up"}
                type="button"
                onClick={() => user ? setDropdownOpen(v => !v) : handleNavClick('login')}
                aria-label={user ? "My Account" : "Login or Sign Up"}
                aria-expanded={dropdownOpen}
              >
                <User className="h-5 w-5" />
              </button>

              {/* Dropdown panel — only when logged in */}
              {user && dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-[#7c2d12] bg-[#3b1708] shadow-xl py-1 z-50">
                  {/* User email */}
                  <div className="px-4 py-2 border-b border-[#7c2d12]">
                    <p className="text-xs text-stone-400">Signed in as</p>
                    <p className="text-sm text-amber-300 font-medium truncate">{user.user_metadata?.name || user.email}</p>
                  </div>
                  {/* My Orders */}
                  <button
                    onClick={() => handleNavClick('orders')}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-stone-300 hover:text-white hover:bg-[#7c2d12] transition-colors"
                  >
                    <Package className="h-4 w-4" />
                    My Orders
                  </button>
                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-[#7c2d12] transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>

            {/* Cart icon */}
            <button
              className="relative p-2 rounded-full text-stone-300 hover:text-white hover:bg-[#7c2d12] transition-colors"
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

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-stone-300 hover:text-white hover:bg-[#7c2d12] transition-colors"
            onClick={() => setIsMenuOpen?.(!isMenuOpen)}
            aria-label="Toggle Menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            type="button"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {isMenuOpen && (
          <nav id="mobile-nav" className="md:hidden pb-3">
            <div className="flex flex-col gap-1 pt-3" style={{ borderTop: '1px solid #7c2d12' }}>
              <button onClick={() => handleNavClick('home')} className="block w-full text-left px-3 py-2 rounded-md text-stone-300 hover:text-white hover:bg-[#7c2d12] transition-colors text-sm font-medium">Home</button>
              <button onClick={() => handleNavClick('perfumes')} className="block w-full text-left px-3 py-2 rounded-md text-stone-300 hover:text-white hover:bg-[#7c2d12] transition-colors text-sm font-medium">Perfumes</button>
              <button onClick={() => handleNavClick('about')} className="block w-full text-left px-3 py-2 rounded-md text-stone-300 hover:text-white hover:bg-[#7c2d12] transition-colors text-sm font-medium">About</button>
              {user ? (
                <>
                  <div className="px-3 py-1 text-xs text-stone-400">{user.user_metadata?.name || user.email}</div>
                  <button onClick={() => handleNavClick('orders')} className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-stone-300 hover:text-white hover:bg-[#7c2d12] transition-colors text-sm font-medium">
                    <Package className="h-4 w-4" /> My Orders
                  </button>
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-red-400 hover:text-red-300 hover:bg-[#7c2d12] transition-colors text-sm font-medium">
                    <LogOut className="h-4 w-4" /> Log Out
                  </button>
                </>
              ) : (
                <button onClick={() => handleNavClick('login')} className="block w-full text-left px-3 py-2 rounded-md text-stone-300 hover:text-white hover:bg-[#7c2d12] transition-colors text-sm font-medium">
                  Login / Sign Up
                </button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
});

NavbarOptimized.displayName = 'NavbarOptimized';

export default NavbarOptimized;
