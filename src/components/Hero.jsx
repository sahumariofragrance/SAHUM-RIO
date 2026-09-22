import React, { useMemo } from "react";
import { ArrowRight } from "lucide-react";

const Hero = React.memo(({ onExplore, onProductNavigate, products = [] }) => {
  const featured = useMemo(
    () => products.find((product) => product.slug === "morning-dew") || products[0],
    [products]
  );

  if (!featured) return null;

  return (
    <section className="border-b border-[var(--color-border)] bg-[var(--color-bg)]" aria-label="Hero banner">
      <div className="grid min-h-[76vh] lg:grid-cols-[1.16fr_0.84fr]">
        <button
          type="button"
          onClick={() => onProductNavigate?.(featured)}
          className="group relative min-h-[58vh] overflow-hidden bg-[var(--color-surface-muted)] lg:min-h-[76vh]"
          aria-label={"View " + featured.name}
        >
          <img
            src={featured.image}
            alt={featured.alt || featured.name}
            className="absolute inset-0 h-full w-full object-cover transition duration-[1400ms] ease-out group-hover:scale-[1.015]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent px-6 pb-7 pt-28 text-left text-white sm:px-9 sm:pb-9">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/70">Featured</p>
            <p className="mt-2 font-serif text-3xl font-normal sm:text-4xl">{featured.name}</p>
          </div>
        </button>

        <div className="flex min-h-[420px] flex-col justify-between px-6 py-10 sm:px-10 md:px-14 lg:min-h-[76vh] lg:px-[6vw] lg:py-16">
          <div className="flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            <span>SAHUMäRIO</span>
            <span className="h-px w-7 bg-[var(--color-border)]" />
            <span>Eau de Parfum</span>
          </div>

          <div className="max-w-xl">
            <h1 className="font-serif text-[clamp(3.4rem,6vw,6.8rem)] font-normal leading-[0.9] tracking-[-0.035em]">
              Fragrance,
              <span className="block italic">without the noise.</span>
            </h1>
            <p className="mt-7 max-w-md text-sm leading-7 text-[var(--color-muted)]">
              A focused Eau de Parfum collection presented with clarity, space, and attention to each bottle.
            </p>
            <button
              onClick={onExplore}
              className="group mt-8 inline-flex items-center gap-3 border-b border-[var(--color-text)] pb-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
            >
              Explore the collection
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <p className="mt-12 text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Independent fragrance house · India
          </p>
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";
export default Hero;
