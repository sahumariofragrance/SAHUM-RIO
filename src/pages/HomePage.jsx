import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import ProductGrid from "../components/ProductGrid";
import SpaLink from "../components/SpaLink";
import IndiaFlag from "../components/IndiaFlag";
import PromoTicket from "../components/PromoTicket";
import DiwaliOffer from "../components/DiwaliOffer";
import ScentQuiz, { QuizInvite } from "../components/ScentQuiz";
import SurpriseHint from "../components/SurpriseHint";
import TesterEditBand from "../components/testers/TesterEditBand";
import AudienceFilter from "../components/AudienceFilter";
import { onSaleFirst } from "../lib/catalogue";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/cartContext";
import { useRememberedAudience } from "../lib/useAudience";

const SORT_KEY = "sahumario-sort-home";
const SORTS = {
  featured: { label: "Featured", compare: null },
  "price-asc": { label: "Price: low to high", compare: (a, b) => a.price - b.price },
  "price-desc": { label: "Price: high to low", compare: (a, b) => b.price - a.price },
  name: { label: "Name: A to Z", compare: (a, b) => a.name.localeCompare(b.name) },
};

export default function HomePage({ onProductNavigate, setCurrentPage, openQuiz = false }) {
  const { items, addToCart, updateQty } = useCart();
  const { products: catalogueProducts, loading } = useProducts();
  // Remembered for the visit, like the "For" filter, so coming back from a perfume keeps it.
  const [sort, setSortState] = useState(() => {
    try { const saved = sessionStorage.getItem(SORT_KEY); return SORTS[saved] ? saved : "featured"; } catch { return "featured"; }
  });
  const setSort = useCallback((value) => {
    setSortState(value);
    try { sessionStorage.setItem(SORT_KEY, value); } catch { /* private mode */ }
  }, []);
  const [audience, setAudience] = useRememberedAudience("home", catalogueProducts);
  // sahumario.com/quiz opens the homepage with the quiz already showing.
  const [quizOpen, setQuizOpen] = useState(openQuiz);
  const itemQtyById = useMemo(() => items.reduce((acc, item) => { acc[item.product_id] = item.qty; return acc; }, {}), [items]);
  const products = useMemo(() => {
    const list = catalogueProducts
      .filter((product) => audience === "all" || product.audience === audience)
      .map((product) => ({ ...product, qty: itemQtyById[product.id] ?? 0 }));
    const { compare } = SORTS[sort];
    // Perfumes that can be bought now come before those coming soon.
    return onSaleFirst(compare ? [...list].sort(compare) : list);
  }, [catalogueProducts, itemQtyById, sort, audience]);
  const handleAdd = useCallback((product) => addToCart(product), [addToCart]);
  const handleQty = useCallback((productId, qty) => updateQty(productId, qty), [updateQty]);
  // Also when coming back to /quiz with the browser's back button.
  useEffect(() => { if (openQuiz) setQuizOpen(true); }, [openQuiz]);
  const closeQuiz = useCallback(() => {
    setQuizOpen(false);
    if (openQuiz) setCurrentPage?.("home");
  }, [openQuiz, setCurrentPage]);

  return <>
    <div className="mx-auto max-w-[1440px] px-5 sm:px-8 md:px-12">
      <div className="relative isolate pb-10 pt-14 text-center md:pb-14 md:pt-20">
        <div className="motif-jaali" aria-hidden="true" />
        <h1 className="font-serif text-[clamp(2.25rem,4vw,3.5rem)] font-normal leading-none tracking-[-0.02em]">
          <span className="sr-only">SAHUMäRIO® </span>Eau de Parfum
        </h1>
        <div className="motif-patola mx-auto mt-5 w-36 opacity-70" aria-hidden="true" />
        <p className="mt-5 inline-flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
          <IndiaFlag />
          Made in India
        </p>
        <DiwaliOffer />
        <QuizInvite onStart={() => setQuizOpen(true)} />
        <SurpriseHint />
        <PromoTicket />
      </div>

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

      <AudienceFilter products={catalogueProducts} value={audience} onChange={setAudience} className="mt-4" />

      <div className="pb-24 pt-6 md:pb-32 md:pt-8">
        <ProductGrid products={products} loading={loading} onSelectProduct={onProductNavigate} onAddToCart={handleAdd} onUpdateQty={handleQty} />
      </div>

      <TesterEditBand onOpen={() => setCurrentPage?.("testers")} />

      <div className="mb-24 flex flex-col items-center gap-5 text-center md:mb-32">
        <p className="text-sm leading-6 text-[var(--color-muted)]">Gifting for weddings, corporate and events — enquiries from ₹10,000.</p>
        <SpaLink href="/bulk-orders" onNavigate={() => setCurrentPage?.("bulk-orders")} className="group inline-flex items-center gap-3 border-b border-current pb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition-opacity hover:opacity-70">
          Bulk orders <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </SpaLink>
      </div>
    </div>
    <ScentQuiz open={quizOpen} onClose={closeQuiz} onProductNavigate={onProductNavigate} onGoToBag={() => setCurrentPage?.("cart")} />
  </>;
}
