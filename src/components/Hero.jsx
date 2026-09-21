import React, { useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight } from "lucide-react";

const Hero = React.memo(({ onExplore, onProductNavigate, products = [] }) => {
  const available = useMemo(() => products.slice(0, 5), [products]);
  const [activeId, setActiveId] = useState(available[0]?.id ?? null);
  const active = available.find((product) => product.id === activeId) || available[0];

  if (!active) return null;

  return (
    <section className="overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-bg)]" aria-label="Hero banner">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid min-h-[620px] items-stretch gap-10 py-10 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:py-14 lg:min-h-[690px]">
          <div className="flex flex-col justify-between py-2 md:py-6">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                <span>The fragrance edit</span>
                <span className="h-px w-10 bg-[var(--color-border)]" />
                <span>01—{String(available.length).padStart(2, "0")}</span>
              </div>

              <h1 className="mt-8 max-w-3xl font-serif text-[clamp(4rem,9vw,8.4rem)] font-semibold leading-[0.78] tracking-[-0.055em]">
                WEAR
                <span className="block pl-[0.16em] italic font-medium">the</span>
                <span className="block">MOMENT.</span>
              </h1>

              <div className="mt-9 flex max-w-xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <p className="max-w-sm text-sm leading-7 text-[var(--color-muted)] md:text-base">
                  A growing collection of oil-based perfumes, each with its own identity. Choose the one that feels right today.
                </p>
                <button
                  onClick={onExplore}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--color-text)] px-5 py-3 text-sm font-semibold transition hover:bg-[var(--color-text)] hover:text-[var(--color-bg)]"
                >
                  View collection <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-12 border-t border-[var(--color-border)] pt-5">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Fragrance index
              </p>
              <div className="grid grid-cols-1 gap-0 sm:grid-cols-5">
                {available.map((product, index) => {
                  const selected = product.id === active.id;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onMouseEnter={() => setActiveId(product.id)}
                      onFocus={() => setActiveId(product.id)}
                      onClick={() => setActiveId(product.id)}
                      className={`group border-t border-[var(--color-border)] py-3 text-left sm:border-l sm:border-t-0 sm:px-3 sm:first:border-l-0 ${selected ? "text-amber-700" : "text-[var(--color-text)]"}`}
                      aria-pressed={selected}
                    >
                      <span className="block text-[9px] font-semibold tracking-[0.18em] text-[var(--color-muted)]">
                        0{index + 1}
                      </span>
                      <span className="mt-1 block truncate font-serif text-sm font-semibold md:text-base">
                        {product.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center md:justify-end">
            <div className="pointer-events-none absolute left-0 top-1/4 hidden -rotate-90 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)] md:block">
              SAHUMäRIO / Oil-Based Fragrance
            </div>

            <button
              type="button"
              onClick={() => onProductNavigate?.(active)}
              className="group relative block w-full max-w-[560px] overflow-hidden rounded-t-[16rem] rounded-b-[2.4rem] bg-[var(--color-surface-muted)] shadow-[0_30px_80px_rgba(54,37,23,0.14)]"
              aria-label={`View ${active.name}`}
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  key={active.image}
                  src={active.image}
                  alt={active.alt || active.name}
                  className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.025]"
                />
              </div>

              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-5 rounded-[1.5rem] border border-white/20 bg-black/45 px-5 py-4 text-left text-white backdrop-blur-md">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/65">Selected fragrance</p>
                  <p className="mt-1 font-serif text-2xl font-semibold">{active.name}</p>
                  <p className="mt-1 text-sm text-white/75">₹{Number(active.price).toLocaleString("en-IN")}</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/35 transition group-hover:bg-white group-hover:text-black">
                  <ArrowDownRight className="h-5 w-5" />
                </span>
              </div>
            </button>

            <div className="absolute -bottom-2 -right-2 hidden text-right md:block">
              <p className="font-serif text-5xl font-semibold text-[var(--color-border)]">{String(available.length).padStart(2, "0")}</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">fragrances today</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";
export default Hero;
