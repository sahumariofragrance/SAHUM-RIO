import React, { useCallback, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import ProductGrid from "../components/ProductGrid";
import SpaLink from "../components/SpaLink";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/cartContext";
import { bottleCutout } from "../data/bottleCutouts";

const SORTS = {
  featured: { label: "Featured", compare: null },
  "price-asc": { label: "Price: low to high", compare: (a, b) => a.price - b.price },
  "price-desc": { label: "Price: high to low", compare: (a, b) => b.price - a.price },
  name: { label: "Name: A to Z", compare: (a, b) => a.name.localeCompare(b.name) },
};

/**
 * Collection line-up: every bottle standing together on the page itself,
 * under a centred title. Each bottle links to its perfume page.
 */
function Banner({ products, onProductNavigate }) {
  const lineup = products.filter((product) => bottleCutout(product.slug));
  return (
    <section className="relative isolate overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-5 pt-14 text-center sm:px-8 md:px-12 md:pt-20">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-muted)]">SAHUMäRIO®</p>
        <h1 className="mt-4 font-serif text-[clamp(2.75rem,5.5vw,5rem)] font-normal leading-none tracking-[-0.03em]">
          <span className="sr-only">SAHUMäRIO® </span>Eau de Parfum
        </h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[var(--color-muted)]">
          Made in Rajkot, Gujarat. Each fragrance with its own name, character and identity.
        </p>

        {lineup.length > 0 && (
          <div className="mt-12 flex items-end justify-center gap-[clamp(0.75rem,2.2vw,2rem)] pb-[clamp(3rem,6vw,5.5rem)] md:mt-16">
            {lineup.map((product, index) => (
              <SpaLink
                key={product.id}
                href={`/product/${product.slug}`}
                onNavigate={() => onProductNavigate(product)}
                aria-label={product.name}
                className={`group relative w-[clamp(5.5rem,10vw,10rem)] shrink-0 transition-transform duration-700 ease-out hover:-translate-y-3 ${index >= 3 ? "hidden sm:block" : "block"}`}
              >
                <img
                  src={bottleCutout(product.slug)}
                  alt={product.alt || product.name}
                  width="480"
                  height="860"
                  loading="eager"
                  fetchpriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                  className="bottle-reflect h-auto w-full"
                />
                <span className="absolute inset-x-0 top-full mt-3 block whitespace-nowrap text-center text-[9px] font-semibold uppercase tracking-[0.22em] text-transparent transition-colors duration-500 group-hover:text-[var(--color-text)] group-focus-visible:text-[var(--color-text)]">
                  {product.name}
                </span>
              </SpaLink>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function HomePage({ onProductNavigate, setCurrentPage }) {
  const { items, addToCart, updateQty } = useCart();
  const { products: catalogueProducts, loading } = useProducts();
  const [sort, setSort] = useState("featured");
  const itemQtyById = useMemo(() => items.reduce((acc, item) => { acc[item.product_id] = item.qty; return acc; }, {}), [items]);
  const products = useMemo(() => {
    const list = catalogueProducts.map((product) => ({ ...product, qty: itemQtyById[product.id] ?? 0 }));
    const { compare } = SORTS[sort];
    return compare ? [...list].sort(compare) : list;
  }, [catalogueProducts, itemQtyById, sort]);
  const handleAdd = useCallback((product) => addToCart(product), [addToCart]);
  const handleQty = useCallback((productId, qty) => updateQty(productId, qty), [updateQty]);

  return <>
    <Banner products={catalogueProducts} onProductNavigate={onProductNavigate} />

    <div className="mx-auto max-w-[1440px] px-5 sm:px-8 md:px-12">
      <div id="collection" className="flex scroll-mt-24 items-center justify-between gap-4 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">
          {loading ? "Loading…" : `${products.length} ${products.length === 1 ? "Product" : "Products"}`}
        </p>
        <label className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em]">
          <span className="hidden text-[var(--color-muted)] sm:inline">Sort by</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="cursor-pointer border-0 bg-transparent py-1 pr-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-text)]"
          >
            {Object.entries(SORTS).map(([value, { label }]) => (
              <option key={value} value={value} className="bg-[var(--color-bg)] normal-case">{label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="pb-24 pt-6 md:pb-32 md:pt-8">
        <ProductGrid products={products} loading={loading} onSelectProduct={onProductNavigate} onAddToCart={handleAdd} onUpdateQty={handleQty} />
      </div>

      <div className="mb-24 flex flex-col items-center gap-5 text-center md:mb-32">
        <p className="text-sm leading-6 text-[var(--color-muted)]">Gifting for weddings, corporate and events — enquiries from ₹10,000.</p>
        <SpaLink href="/bulk-orders" onNavigate={() => setCurrentPage?.("bulk-orders")} className="group inline-flex items-center gap-3 border-b border-current pb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition-opacity hover:opacity-70">
          Bulk orders <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </SpaLink>
      </div>
    </div>
  </>;
}
