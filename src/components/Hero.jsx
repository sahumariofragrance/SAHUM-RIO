import React, { useEffect, useState } from "react";
import { RouterLink } from "../router";

const Hero = React.memo(() => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/hero-bg.svg')" }}
      aria-label="Hero banner"
    >
      <div className="absolute inset-0 bg-[var(--color-hero-overlay)] backdrop-blur-sm"></div>

      <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
        <h1
          className={`text-4xl md:text-6xl font-semibold tracking-tight transition-transform duration-1000 ${
            animate ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
          }`}
        >
          Authentic <span className="text-amber-600">Oil-Based</span> Perfumes
        </h1>
        <p
          className={`mt-4 text-[var(--color-muted)] max-w-2xl mx-auto text-lg transition-opacity duration-1000 delay-200 ${
            animate ? "opacity-100" : "opacity-0"
          }`}
        >
          Long-lasting fragrances that tell your story.
        </p>
        <p
          className={`mt-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700 transition-opacity duration-1000 delay-300 ${
            animate ? "opacity-100" : "opacity-0"
          }`}
        >
          Promo Code: WELCOME10
        </p>
        <div
          className={`mt-8 transition-opacity duration-1000 delay-500 ${
            animate ? "opacity-100" : "opacity-0"
          }`}
        >
          <RouterLink
            to="/perfumes"
            className="inline-block rounded-lg bg-amber-600 px-6 py-3 text-lg font-medium text-white shadow-lg transition-colors hover:bg-amber-700"
          >
            Explore Collection
          </RouterLink>
        </div>
      </div>
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
