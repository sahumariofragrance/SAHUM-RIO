import React, { useCallback, useMemo } from "react";
import { ArrowRight, CreditCard, PackageCheck, Sparkles, UserRoundCheck } from "lucide-react";
import Hero from "../components/Hero";
import ProductGrid from "../components/ProductGrid";
import localProducts from "../data/products.json";
import { useCart } from "../context/cartContext";

export default function HomePage({ onProductNavigate, setCurrentPage }) {
  const { items, addToCart, updateQty } = useCart();

  const itemQtyById = useMemo(() => items.reduce((acc, item) => {
    acc[item.product_id] = item.qty;
    return acc;
  }, {}), [items]);

  const products = useMemo(() => localProducts.map((product) => ({
    ...product,
    qty: itemQtyById[product.id] ?? 0,
  })), [itemQtyById]);

  const featured = products.slice(0, 4);
  const editorial = products[4] || products[0];

  const handleAdd = useCallback((product) => addToCart(product), [addToCart]);
  const handleQty = useCallback((productId, qty) => updateQty(productId, qty), [updateQty]);

  return (
    <>
      <Hero
        onExplore={() => setCurrentPage?.("perfumes")}
        onProductNavigate={onProductNavigate}
        products={products}
      />

      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-[var(--color-border)] px-4 sm:grid-cols-4 sm:divide-y-0">
          {[
            [PackageCheck, "Free India shipping", "No shipping charge at checkout"],
            [CreditCard, "Verified payments", "Razorpay checkout with server verification"],
            [UserRoundCheck, "Guest checkout", "Shop without creating an account"],
            [Sparkles, "Oil-based perfumes", "A focused collection of signature fragrances"],
          ].map(([Icon, title, copy]) => (
            <div key={title} className="px-4 py-5 text-center">
              <Icon className="mx-auto h-5 w-5 text-amber-700" />
              <p className="mt-2 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Featured fragrances</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight md:text-4xl">The SAHUMäRIO edit</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
              Five fragrances, one focused collection. Explore the scents customers can shop right now.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage?.("perfumes")}
            className="hidden items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-800 sm:inline-flex"
          >
            Shop all <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <ProductGrid
          products={featured}
          onSelectProduct={onProductNavigate}
          onAddToCart={handleAdd}
          onUpdateQty={handleQty}
        />

        <button
          onClick={() => setCurrentPage?.("perfumes")}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-text)] px-6 py-3 text-sm font-semibold sm:hidden"
        >
          Shop all fragrances <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {editorial && (
        <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-24">
          <div className="overflow-hidden rounded-[2rem] bg-[#24160f] text-[#fff8ed]">
            <div className="grid md:grid-cols-2">
              <div className="order-2 flex flex-col justify-center px-7 py-10 md:order-1 md:px-12 md:py-16">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Discover your next bottle</p>
                <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight md:text-5xl">
                  Fragrance should feel personal.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-7 text-stone-300">
                  Browse the full collection, open any fragrance page for details, and choose the bottle that feels most like you.
                </p>
                <div className="mt-7">
                  <button
                    onClick={() => onProductNavigate?.(editorial)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#fff8ed] px-6 py-3 text-sm font-semibold text-[#24160f] hover:bg-white"
                  >
                    Explore {editorial.name} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onProductNavigate?.(editorial)}
                className="order-1 block min-h-[360px] overflow-hidden bg-[#e8dccb] md:order-2"
                aria-label={`View ${editorial.name}`}
              >
                <img
                  src={editorial.image}
                  alt={editorial.alt || editorial.name}
                  className="h-full min-h-[360px] w-full object-cover transition duration-500 hover:scale-[1.03]"
                />
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Simple shopping</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold md:text-4xl">From discovery to delivery</h2>
          <div className="mx-auto mt-9 grid max-w-4xl gap-4 text-left sm:grid-cols-3">
            {[
              ["01", "Choose your fragrance", "Browse the collection and open any perfume for full product details."],
              ["02", "Checkout your way", "Use your account or continue as a guest with your delivery details."],
              ["03", "Track the journey", "Order and shipping updates are sent as your order moves through fulfilment."],
            ].map(([number, title, copy]) => (
              <div key={number} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6">
                <span className="text-xs font-semibold tracking-[0.2em] text-amber-700">{number}</span>
                <h3 className="mt-3 font-serif text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
