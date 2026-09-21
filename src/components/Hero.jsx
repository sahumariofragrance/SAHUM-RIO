import React, { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

const Hero = React.memo(({ onExplore, onProductNavigate, products = [] }) => {
  const available = useMemo(() => products.slice(0, 6), [products]);
  const [activeId, setActiveId] = useState(available[0]?.id ?? null);
  const active = available.find((product) => product.id === activeId) || available[0];

  if (!active) return null;

  return (
    <section className="border-b border-[var(--color-border)] bg-[var(--color-bg)]" aria-label="Hero banner">
      <div className="grid min-h-[78vh] lg:grid-cols-[0.88fr_1.12fr]">
        <div className="flex min-h-[560px] flex-col justify-between px-5 py-10 sm:px-8 md:px-12 lg:min-h-[720px] lg:px-[7vw] lg:py-16">
          <div>
            <div className="flex items-center gap-4 text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--color-muted)]">
              <span>SAHUMäRIO</span>
              <span className="h-px w-8 bg-[var(--color-border)]" />
              <span>Eau de Parfum</span>
            </div>

            <h1 className="mt-16 max-w-[11ch] font-serif text-[clamp(3.8rem,7.2vw,7.8rem)] font-normal leading-[0.86] tracking-[-0.045em]">
              Fragrance,
              <span className="block italic">remembered.</span>
            </h1>

            <div className="mt-10 max-w-md">
              <p className="text-sm leading-7 text-[var(--color-muted)] md:text-[15px]">
                A focused collection of Eau de Parfum, each fragrance shaped around a distinct mood, name, and visual world.
              </p>
              <button
                onClick={onExplore}
                className="group mt-7 inline-flex items-center gap-3 border-b border-[var(--color-text)] pb-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
              >
                Explore the collection
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="mt-14">
            <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Select a fragrance
            </p>
            <div className="border-t border-[var(--color-border)]">
              {available.map((product, index) => {
                const selected = product.id === active.id;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onMouseEnter={() => setActiveId(product.id)}
                    onFocus={() => setActiveId(product.id)}
                    onClick={() => setActiveId(product.id)}
                    className={"grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-[var(--color-border)] py-3 text-left transition " + (selected ? "opacity-100" : "opacity-45 hover:opacity-80")}
                    aria-pressed={selected}
                  >
                    <span className="text-[9px] tracking-[0.16em]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="truncate text-sm">{product.name}</span>
                    {selected && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text)]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onProductNavigate?.(active)}
          className="group relative min-h-[560px] overflow-hidden bg-[var(--color-surface-muted)] text-left lg:min-h-[720px]"
          aria-label={"View " + active.name}
        >
          <img
            key={active.image}
            src={active.image}
            alt={active.alt || active.name}
            className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.018]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent px-6 pb-7 pt-32 text-white sm:px-9 sm:pb-9">
            <div className="flex items-end justify-between gap-6 border-t border-white/40 pt-5">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/70">Featured fragrance</p>
                <h2 className="mt-2 font-serif text-4xl font-normal sm:text-5xl">{active.name}</h2>
                <p className="mt-2 text-sm text-white/80">Eau de Parfum · ₹{Number(active.price).toLocaleString("en-IN")}</p>
              </div>
              <span className="mb-1 flex h-11 w-11 items-center justify-center border border-white/60 transition group-hover:bg-white group-hover:text-black">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </button>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";
export default Hero;
