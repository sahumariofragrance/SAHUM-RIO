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
import PerfumeSpotlightRail from "../components/ui/PerfumeSpotlightRail";
import { formatINR } from "../utils/money";
import { useProducts } from "../context/ProductsContext";

// A short line about a perfume for the showcase caption.
function firstSentence(text) {
  return String(text || "").split(/(?<=[.!?])\s/)[0].trim();
}

export default function HomePage({ onProductNavigate, setCurrentPage, openQuiz = false }) {
  const { products: catalogueProducts, loading } = useProducts();
  // sahumario.com/quiz opens the homepage with the quiz already showing.
  const [quizOpen, setQuizOpen] = useState(openQuiz);
  // The homepage shows the perfumes; they are bought from the collection and their own pages.
  const showcase = useMemo(() => forSale(catalogueProducts).map((product) => ({
    id: product.id,
    name: product.name,
    href: `/product/${product.slug}`,
    image: product.image,
    alt: product.alt,
    eyebrow: productBadge(product)?.label,
    description: firstSentence(product.scent_profile || product.description),
    meta: [product.fragrance_family, `${formatINR(product.price)}${product.size_volume ? ` · ${product.size_volume}` : ""}`].filter(Boolean).join(" · "),
    product,
  })), [catalogueProducts]);
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
    </div>

    <PerfumeSpotlightRail
      id="collection"
      className="scroll-mt-24"
      items={showcase}
      loading={loading}
      eyebrow="The SAHUMäRIO gallery"
      heading="Every perfume, in its own light."
      onOpen={(item) => onProductNavigate?.(item.product)}
      action={
        <SpaLink
          href="/perfumes"
          onNavigate={() => setCurrentPage?.("perfumes")}
          className="group inline-flex h-11 items-center gap-2.5 rounded-full bg-[#E9D3A4] px-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#06141B] transition hover:bg-[#F3E3BE]"
        >
          Shop the collection <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </SpaLink>
      }
    />

    <div className="mx-auto max-w-[1440px] px-5 pt-24 sm:px-8 md:px-12 md:pt-32">
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
