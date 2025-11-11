// src/components/Navbar.jsx
import React, { useState } from "react";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useCart } from "../context/cartContext";

export default function Navbar({ currentPage, setCurrentPage, onCartClick, toggleTheme, theme }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { count } = useCart();

  const LinkButton = ({ id, children }) => (
    <button
      onClick={() => setCurrentPage?.(id)}
      className={`${currentPage === id ? "text-amber-600" : "text-gray-700"} hover:text-amber-600 transition px-3 py-2`}
    >
      {children}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          <button onClick={() => setCurrentPage("home")} className="flex items-center text-xl font-bold tracking-wide">
          
        <img
            src="/logo.png"
            alt="Sahumario Logo"
            width={70}
            height={70}/>
            <span className="text-amber-600">SAHUMä</span>RIO
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <LinkButton id="home">Home</LinkButton>
            <LinkButton id="perfumes">Perfumes</LinkButton>
            <LinkButton id="about">About</LinkButton>
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            <button className="relative p-2 rounded-full hover:bg-gray-100" title="Cart" type="button" onClick={onCartClick}>
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Toggle Theme"
              type="button"
            >
              {theme === 'light' ? '🌞' : '🌙'}
            </button>
          </div>

          {/* Mobile cart icon directly visible */}
          <button
            className="md:hidden relative p-2 rounded-full hover:bg-gray-100"
            title="Cart"
            type="button"
            onClick={onCartClick}
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center">
                {count}
              </span>
            )}
          </button>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle Menu" type="button">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {isMenuOpen && (
          <div className="md:hidden pb-3">
            <div className="flex flex-col gap-1 border-t border-gray-100 pt-3">
              <button onClick={() => { setCurrentPage("home"); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100">Home</button>
              <button onClick={() => { setCurrentPage("perfumes"); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100">Perfumes</button>
              <button onClick={() => { setCurrentPage("about"); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100">About</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}