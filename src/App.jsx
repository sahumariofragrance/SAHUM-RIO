import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import PerfumesPage from './pages/PerfumesPage';
import AboutPage from './pages/AboutPage';
// import LoginPage from './pages/LoginPage';
import PerfumeCard from './components/PerfumeCard';
import localProducts from './data/products.json';

function HomePage({ onExplore }) {
  const featuredProducts = localProducts.slice(0, 3);
  const allProducts = localProducts;

  return (
    <>
      <Hero onExplore={onExplore} />

      {/* Featured Products */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h3 className="text-3xl font-bold text-center">Featured Perfumes</h3>
        <p className="mt-2 text-center text-gray-600">Explore our best-selling fragrances.</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((p) => (
            <div
              key={p.id}
              className="transform transition-transform hover:scale-105"
            >
              <PerfumeCard
                name={p.name}
                description={p.description}
                price={p.price}
                productId={p.id}
                image={p.image}
                alt={p.alt || p.name}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Full Collection */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h3 className="text-3xl font-bold text-center">Our Full Collection</h3>
        <p className="mt-2 text-center text-gray-600">Browse our entire range of fragrances.</p>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
          {allProducts.map((p) => (
            <div
              key={p.id}
              className="transform transition-transform hover:scale-105"
            >
              <PerfumeCard
                name={p.name}
                description={p.description}
                price={p.price}
                productId={p.id}
                image={p.image}
                alt={p.alt || p.name}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h3 className="text-3xl font-bold">Why Choose Us?</h3>
          <p className="mt-4 text-gray-700 max-w-2xl mx-auto">
            We offer authentic, long-lasting oil-based perfumes crafted with the finest natural ingredients.
          </p>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-lg">
              <img src="/icons/natural.svg" alt="Natural Ingredients" className="h-12 mx-auto" />
              <h4 className="mt-4 font-semibold">Natural Ingredients</h4>
              <p className="mt-2 text-sm text-gray-600">Experience the purity of nature in every drop.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-lg">
              <img src="/icons/long-lasting.svg" alt="Long-Lasting" className="h-12 mx-auto" />
              <h4 className="mt-4 font-semibold">Long-Lasting</h4>
              <p className="mt-2 text-sm text-gray-600">Our perfumes are designed to last all day.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-lg">
              <img src="/icons/crafted.svg" alt="Crafted with Care" className="h-12 mx-auto" />
              <h4 className="mt-4 font-semibold">Crafted with Care</h4>
              <p className="mt-2 text-sm text-gray-600">Each fragrance is a masterpiece of craftsmanship.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Banner */}
      <section className="bg-gradient-to-r from-amber-500 to-orange-600 py-16 text-white text-center">
        <h3 className="text-3xl font-bold">Discover Your Signature Scent</h3>
        <p className="mt-4">Browse our collection and find the perfect fragrance for you.</p>
        <button
          onClick={onExplore}
          className="mt-8 px-8 py-4 bg-white text-amber-600 font-bold rounded-lg shadow-lg hover:bg-gray-100"
        >
          Explore Collection
        </button>
      </section>
    </>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        toggleTheme={toggleTheme}
      />

      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage onExplore={() => setCurrentPage('perfumes')} />
        )}
        {currentPage === 'perfumes' && <PerfumesPage />}
        {currentPage === 'about' && <AboutPage />}
        {/* {currentPage === 'login' && (
          <LoginPage setCurrentPage={setCurrentPage} setIsLoggedIn={setIsLoggedIn} />
        )} */}
      </main>

      <Footer />
    </div>
  );
}
