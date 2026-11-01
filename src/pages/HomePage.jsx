import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import SpaLink from "../components/SpaLink";
import IndiaFlag from "../components/IndiaFlag";
import PromoTicket from "../components/PromoTicket";
import DiwaliOffer from "../components/DiwaliOffer";
import ScentQuiz, { QuizInvite } from "../components/ScentQuiz";
import SurpriseHint from "../components/SurpriseHint";
import TesterEditBand from "../components/testers/TesterEditBand";
import { forSale, productBadge } from "../lib/catalogue";
import PerfumeSprayRail from "../components/ui/PerfumeSprayRail";
import { formatINR } from "../utils/money";
import { useProducts } from "../context/ProductsContext";

// How many perfumes the homepage shows; the rest are in the collection.
const SHOWCASE_COUNT = 5;

// A short line about a perfume for its card.
function firstSentence(text) {
  return String(text || "").split(/(?<=[.!?])\s/)[0].trim();
}

export default function HomePage({ onProductNavigate, setCurrentPage, openQuiz = false }) {
  const { products: catalogueProducts, loading } = useProducts();
  // sahumario.com/quiz opens the homepage with the quiz already showing.
  const [quizOpen, setQuizOpen] = useState(openQuiz);
  // The homepage shows the first five perfumes (Admin → Catalogue order); they
  // are bought from the collection and their own pages.
  const onSale = useMemo(() => forSale(catalogueProducts), [catalogueProducts]);
  const showcase = useMemo(() => onSale.slice(0, SHOWCASE_COUNT).map((product) => ({
    id: product.id,
    name: product.name,
    href: `/product/${product.slug}`,
    image: product.image,
    alt: product.alt,
    badge: productBadge(product)?.label,
    description: firstSentence(product.scent_profile || product.description),
    meta: `${formatINR(product.price)}${product.size_volume ? ` · ${product.size_volume}` : ""}`,
    product,
  })), [onSale]);
  const shopAll = (
    <SpaLink
      href="/perfumes"
      onNavigate={() => setCurrentPage?.("perfumes")}
      className="group inline-flex items-center gap-3 border-b border-current pb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition-opacity hover:opacity-70"
    >
      {onSale.length > SHOWCASE_COUNT ? `Shop all ${onSale.length} perfumes` : "Shop the collection"}
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
    </SpaLink>
  );
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

      <section id="collection" className="scroll-mt-24 pb-24 md:pb-32" aria-labelledby="favourites-title">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-kesar)]">The house favourites</p>
            <h2 id="favourites-title" className="mt-3 font-serif text-[clamp(2rem,3.4vw,2.75rem)] font-normal leading-none tracking-[-0.01em]">Five to begin with</h2>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              <span className="[@media(hover:hover)]:hidden">Swipe along: each bottle sprays as it reaches the middle.</span>
              <span className="hidden [@media(hover:hover)]:inline">Hover over a bottle to spray it.</span>
            </p>
          </div>
          <div className="hidden sm:block">{shopAll}</div>
        </div>
        <PerfumeSprayRail
          className="mt-8"
          aria-label="Five SAHUMäRIO perfumes"
          items={showcase}
          loading={loading}
          onOpen={(item) => onProductNavigate?.(item.product)}
        />
        <div className="mt-8 flex justify-center sm:hidden">{shopAll}</div>
      </section>

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
