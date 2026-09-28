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

/**
 * Collection banner: the bottles lined up on a lit studio backdrop with the
 * title in the corner. Each bottle links to its perfume page.
 */
function Banner({ products, onProductNavigate }) {
  const lineup = products.filter((product) => product.image).slice(0, 3);
  return (
    <section className="studio-backdrop relative isolate overflow-hidden text-white">
      <div className="mx-auto flex min-h-[420px] max-w-[1440px] flex-col justify-end px-5 pb-8 pt-10 sm:px-8 md:h-[min(62svh,560px)] md:flex-row md:items-end md:justify-between md:px-12 md:pb-10 md:pt-12">
        <div className="order-2 mt-8 md:order-1 md:mt-0 md:pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">SAHUMäRIO®</p>
          <h1 className="mt-2 text-[clamp(2.25rem,4.5vw,3.75rem)] font-semibold uppercase leading-none tracking-[-0.01em]">
            <span className="sr-only">SAHUMäRIO® </span>Eau de Parfum
          </h1>
        </div>

        {lineup.length > 0 && (
          <div className="order-1 flex h-[240px] items-end justify-center gap-3 sm:h-[300px] sm:gap-4 md:order-2 md:mr-[6%] md:h-[82%] md:gap-5">
            {lineup.map((product, index) => (
              <SpaLink
                key={product.id}
                href={`/product/${product.slug}`}
                onNavigate={() => onProductNavigate(product)}
                aria-label={product.name}
                className="bottle-reflect group relative block h-full aspect-[3/4] overflow-hidden shadow-[0_30px_50px_-25px_rgba(0,0,0,0.8)] transition-transform duration-700 ease-out hover:-translate-y-2"
              >
                <img
                  src={product.image}
                  alt={product.alt || product.name}
                  loading="eager"
                  fetchpriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]"
                />
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
