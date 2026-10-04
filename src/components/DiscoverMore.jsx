import React, { useMemo } from "react";
import PerfumeCardOptimized from "./PerfumeCardOptimized";
import SpaLink from "./SpaLink";
import { useCart } from "../context/cartContext";
import { useProducts } from "../context/ProductsContext";

// Phones: two cards across with the third peeking in. Desktop: one row.
const CARD_SIZES = "(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 40vw";

/**
 * "Discover more" on a perfume page: the rest of the collection, starting
 * with the perfume after this one. Visitors who land straight on one perfume
 * (e.g. from an Instagram ad) can browse the others without the menu.
 */
export default function DiscoverMore({ current, onProductNavigate, onViewAll }) {
  const { products } = useProducts();
  const { items, addToCart, updateQty } = useCart();

  const others = useMemo(() => {
    const index = products.findIndex((product) => product.id === current.id);
    if (index < 0) return products.filter((product) => product.id !== current.id);
    return [...products.slice(index + 1), ...products.slice(0, index)];
  }, [products, current.id]);

  if (others.length === 0) return null;
  const quantityOf = (id) => items.find((item) => item.product_id === id)?.qty || 0;

  return (
    <section aria-labelledby="discover-more-title" className="mt-20 border-t border-[var(--color-border)] pt-10 md:mt-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">The Collection</p>
          <h2 id="discover-more-title" className="mt-2 scroll-mt-28 font-serif text-2xl font-normal tracking-[-0.01em] md:text-3xl">Discover more</h2>
        </div>
        <SpaLink href="/perfumes" onNavigate={onViewAll} className="shrink-0 border-b border-current pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] transition-opacity hover:opacity-70">
          View all {products.length}
        </SpaLink>
      </div>

      <div className="scrollbar-hide -mx-5 mt-7 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 sm:-mx-8 sm:scroll-px-8 sm:gap-5 sm:px-8 md:-mx-12 md:scroll-px-12 md:px-12 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-6 lg:overflow-visible lg:px-0">
        {others.map((product) => (
          <div key={product.id} className="w-[40vw] shrink-0 snap-start sm:w-[30vw] lg:w-auto">
            <PerfumeCardOptimized
              product={product}
              quantity={quantityOf(product.id)}
              onClickCard={() => onProductNavigate(product)}
              onAdd={addToCart}
              onUpdateQty={updateQty}
              sizes={CARD_SIZES}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
