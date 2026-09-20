import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const Hero = React.memo(({ onExplore, onProductNavigate, products = [] }) => {
  const [animate, setAnimate] = useState(false);
  const heroProducts = products.slice(0, 3);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[var(--color-bg)]" aria-label="Hero banner">
      <div className="mx-auto grid min-h-[560px] max-w-7xl items-center gap-10 px-4 py-10 md:grid-cols-[0.92fr_1.08fr] md:px-6 md:py-16 lg:min-h-[650px]">
        <div className={`transition duration-700 ${animate ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">SAHUMäRIO fragrance</p>
          <h1 className="mt-4 max-w-xl font-serif text-5xl font-semibold leading-[0.98] tracking-tight md:text-6xl lg:text-7xl">
            Find a fragrance that stays with you.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[var(--color-muted)] md:text-lg">
            A focused collection of oil-based perfumes with a warm, modern point of view.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={onExplore}
              className="inline-flex items-center gap-2 rounded-full bg-[#24160f] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-amber-800"
            >
              Shop perfumes <ArrowRight className="h-4 w-4" />
            </button>
            {heroProducts[0] && (
              <button
                onClick={() => onProductNavigate?.(heroProducts[0])}
                className="rounded-full border border-[var(--color-text)] px-6 py-3.5 text-sm font-semibold transition hover:bg-[var(--color-surface)]"
              >
                Explore {heroProducts[0].name}
              </button>
            )}
          </div>
          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
            <span>5 fragrances</span>
            <span>From ₹749</span>
            <span>Guest checkout</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <div className="absolute -left-6 top-12 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl" aria-hidden="true" />
          <div className="absolute -right-2 bottom-8 h-48 w-48 rounded-full bg-orange-200/40 blur-3xl" aria-hidden="true" />
          <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
            {heroProducts.map((product, index) => (
              <button
                type="button"
                key={product.id}
                onClick={() => onProductNavigate?.(product)}
                className={`group relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-[var(--color-surface)] shadow-xl shadow-black/5 ${index === 0 ? "col-span-2 aspect-[16/9]" : "aspect-[4/5]"}`}
                aria-label={`View ${product.name}`}
              >
                <img
                  src={product.image}
                  alt={product.alt || product.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-2xl bg-black/55 px-4 py-3 text-left text-white backdrop-blur-sm">
                  <div>
                    <p className="font-serif text-lg font-semibold">{product.name}</p>
                    <p className="text-xs text-white/75">₹{Number(product.price).toLocaleString("en-IN")}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";
export default Hero;
