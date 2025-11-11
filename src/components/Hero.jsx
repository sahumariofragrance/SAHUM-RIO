import React, { useEffect, useState } from "react";

export default function Hero({ onExplore }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/hero-bg.png')" }}
    >
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>

      <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
        <h1
          className={`text-4xl md:text-6xl font-semibold tracking-tight transition-transform duration-1000 ${
            animate ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
          }`}
        >
          Authentic <span className="text-amber-600">Oil-Based</span> Perfumes
        </h1>
        <p
          className={`mt-4 text-gray-700 max-w-2xl mx-auto text-lg transition-opacity duration-1000 delay-200 ${
            animate ? "opacity-100" : "opacity-0"
          }`}
        >
          Long-lasting fragrances that tell your story.
        </p>
        <div
          className={`mt-8 transition-opacity duration-1000 delay-500 ${
            animate ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={onExplore}
            className="px-6 py-3 rounded-lg bg-amber-600 text-white hover:bg-amber-700 shadow-lg transition"
          >
            Explore Collection
          </button>
        </div>
        <div
          className={`mt-12 text-gray-500 transition-opacity duration-1000 delay-700 ${
            animate ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Removed Scroll Down */}
        </div>
      </div>
    </section>
  );
}
