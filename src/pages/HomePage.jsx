import React, { useCallback, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import ProductGrid from "../components/ProductGrid";
import SpaLink from "../components/SpaLink";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/cartContext";

const SORTS = {
  featured: { label: "Featured", compare: null },
  "price-asc": { label: "Price: low to high", compare: (a, b) => a.price - b.price },
  "price-desc": { label: "Price: high to low", compare: (a, b) => b.price - a.price },
  name: { label: "Name: A to Z", compare: (a, b) => a.name.localeCompare(b.name) },
};

// Bottles cut out of their product photos (public/banner/<slug>.webp), all
// scaled to the same bottle width so they stand together as one line-up.
// A perfume without a cut-out simply does not appear in the banner.
const BANNER_BOTTLES = new Set(["bloom", "dew-drop", "lemon-breeze", "morning-dew", "night-queen", "blix"]);

/**
 * Collection banner: every bottle standing together on one lit studio
 * backdrop, with the title above. Each bottle links to its perfume page.
 */
function Banner({ products, onProductNavigate }) {
  const lineup = products.filter((product) => BANNER_BOTTLES.has(product.slug));
  return (
    <section className="studio-backdrop relative isolate overflow-hidden text-white">
      <div className="mx-auto flex max-w-[1440px] flex-col px-5 pb-10 pt-10 sm:px-8 md:min-h-[min(64svh,580px)] md:px-12 md:pb-14 md:pt-12">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">SAHUMäRIO®</p>
          <h1 className="mt-2 text-[clamp(2.25rem,4.5vw,3.75rem)] font-semibold uppercase leading-none tracking-[-0.01em]">
            <span className="sr-only">SAHUMäRIO® </span>Eau de Parfum
          </h1>
        </div>

        {lineup.length > 0 && (
          <div className="mt-10 flex flex-1 items-end justify-center gap-[clamp(0.75rem,2.2vw,2rem)] pb-[clamp(2.5rem,5vw,4.5rem)]">
            {lineup.map((product, index) => (
              <SpaLink
                key={product.id}
                href={`/product/${product.slug}`}
                onNavigate={() => onProductNavigate(product)}
                aria-label={product.name}
                className={`group relative w-[clamp(5.5rem,10.5vw,10.5rem)] shrink-0 transition-transform duration-700 ease-out hover:-translate-y-3 ${index >= 3 ? "hidden sm:block" : "block"}`}
              >
                <img
                  src={`/banner/${product.slug}.webp`}
                  alt={product.alt || product.name}
                  width="480"
                  height="860"
                  loading="eager"
                  fetchpriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                  className="bottle-reflect h-auto w-full"
                />
                <span className="absolute inset-x-0 top-full mt-3 block whitespace-nowrap text-center text-[9px] font-semibold uppercase tracking-[0.22em] text-white/0 transition-colors duration-500 group-hover:text-white/80 group-focus-visible:text-white/80">
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
      <nav aria-label="Breadcrumb" className="py-4 text-[11px] uppercase tracking-[0.08em]">
        <ol className="flex items-center gap-2">
          <li>Home</li>
          <li aria-hidden="true" className="text-[var(--color-muted)]">/</li>
          <li className="text-[var(--color-muted)]">
            <SpaLink href="/perfumes" onNavigate={() => setCurrentPage?.("perfumes")} className="hover:underline">Fragrance</SpaLink>
          </li>
        </ol>
      </nav>

      <div id="collection" className="flex scroll-mt-24 items-center justify-between gap-4 border-y border-[var(--color-border)] py-4">
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

      <div className="pb-24 pt-10 md:pb-32 md:pt-14">
        <ProductGrid products={products} loading={loading} onSelectProduct={onProductNavigate} onAddToCart={handleAdd} onUpdateQty={handleQty} />
      </div>

      <div className="mb-24 flex flex-col gap-5 border-t border-[var(--color-border)] pt-10 md:mb-32 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-6 text-[var(--color-muted)]">Gifting for weddings, corporate and events — enquiries from ₹10,000.</p>
        <SpaLink href="/bulk-orders" onNavigate={() => setCurrentPage?.("bulk-orders")} className="group inline-flex items-center gap-3 border-b border-current pb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition-opacity hover:opacity-70">
          Bulk orders <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </SpaLink>
      </div>
    </div>
  </>;
}
