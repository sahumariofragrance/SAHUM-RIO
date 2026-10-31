import React, { useEffect, useMemo, useState } from "react";
import SafeImage from "../components/SafeImage";
import ProductReviews from "../components/ProductReviews";
import BrandMark from "../components/BrandMark";
import { useCart } from "../context/cartContext";
import { useProducts } from "../context/ProductsContext";
import { formatINR } from "../utils/money";
import PromoLine from "../components/PromoLine";
import ComboNudge from "../components/ComboNudge";
import DiscoverMore from "../components/DiscoverMore";
import { pixelContact, pixelViewContent } from "../lib/metaPixel";
import { productJsonLd } from "../seo/site";
import { setPageJsonLd } from "../seo/head";
import { optimizedSrc } from "../utils/optimizedImage";
import SpaLink from "../components/SpaLink";
import { isSampleSet } from "../lib/samples";
import { TESTER, forSale, isComingSoon, testerOf } from "../lib/catalogue";
import { whatsappLink } from "../components/WhatsAppButton";

const AUDIENCE_DETAIL = { Men: "Men", Women: "Women", Unisex: "Everyone (unisex)" };

export default function ProductPage({ slug, navigate, onProductNavigate }) {
  const { items, addToCart, updateQty } = useCart();
  const { bySlug, loading, products } = useProducts();
  const product = useMemo(() => bySlug.get(slug) || null, [bySlug, slug]);
  // The discovery box, if the catalogue has one: offered to visitors who
  // aren't sure which perfume to pick.
  const sampleSet = useMemo(() => products.find(isSampleSet) || null, [products]);
  // The box holds the perfumes already made, not those coming soon.
  const perfumeCount = useMemo(() => forSale(products).length, [products]);

  const galleryUrls = useMemo(() => product?.gallery || [], [product]);
  const [activeImage, setActiveImage] = useState("");
  const [failedImages, setFailedImages] = useState([]);
  const [rating, setRating] = useState(null);

  useEffect(() => { setRating(null); }, [product?.id]);
  useEffect(() => { if (product) pixelViewContent(product); }, [product]);

  useEffect(() => {
    if (!product) return undefined;
    setPageJsonLd(productJsonLd(product, rating));
    return () => setPageJsonLd(null);
  }, [product, rating]);

  useEffect(() => {
    setActiveImage(product?.image || "");
    setFailedImages([]);
  }, [product?.id, product?.image]);

  const visibleGallery = useMemo(
    () => galleryUrls.filter((url) => !failedImages.includes(url)),
    [galleryUrls, failedImages]
  );

  const quantity = product ? (items.find((item) => item.product_id === product.id)?.qty || 0) : 0;
  // Its 10 ml tester (src/data/testers.json), for visitors who want to try it first.
  const tester = useMemo(() => (product && !isSampleSet(product) ? testerOf(product) : null), [product]);
  const testerQty = tester ? (items.find((item) => item.product_id === tester.id)?.qty || 0) : 0;
  const comingSoon = isComingSoon(product);
  const productDetails = product ? [
    ["For", AUDIENCE_DETAIL[product.audience]],
    ["Size / volume", product.size_volume],
    ["Fragrance family", product.fragrance_family],
    ["Scent profile", product.scent_profile],
    ["Occasion", product.occasion],
    ["Fragrance notes", product.notes],
  ].filter(([, value]) => String(value || "").trim()) : [];

  function markImageFailed(url) {
    setFailedImages((current) => current.includes(url) ? current : [...current, url]);
    if (activeImage === url) setActiveImage(product?.image || "");
  }

  if (loading && !product) {
    return <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 md:px-12"><div className="h-[70vh] animate-pulse bg-[var(--color-surface-muted)]" /></section>;
  }

  if (!product) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-24 text-center">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--color-muted)]">404</p>
        <h1 className="mt-4 font-serif text-5xl font-normal">Perfume not found</h1>
        <button onClick={() => navigate("perfumes")} className="mt-8 border-b border-[var(--color-text)] pb-1 text-[10px] font-semibold uppercase tracking-[0.16em]">Back to collection</button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 md:px-12 md:py-12">
      <button onClick={() => navigate("perfumes")} className="mb-8 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)] transition hover:text-[var(--color-text)]" aria-label="Back to perfume collection">← The Collection</button>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          {/* 4:5 like the product photos, so phones show no empty band under the photo. */}
          <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-surface-muted)]">
            <SafeImage src={activeImage || product.image} alt={product.alt || product.name} sizes="(min-width: 1024px) 55vw, 100vw" className="absolute inset-0 h-full w-full object-cover" priority />
            <p className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-[10px] font-medium tracking-[0.04em] text-white/90 backdrop-blur-[2px]">
              Real bottle · AI-generated scene
            </p>
          </div>

          {visibleGallery.length > 1 && (
            <div className="mt-3 grid grid-cols-6 gap-2" aria-label={product.name + " image gallery"}>
              {galleryUrls.map((url, index) => (
                !failedImages.includes(url) && (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActiveImage(url)}
                    className={"relative aspect-[4/5] overflow-hidden border transition " + ((activeImage || product.image) === url ? "border-[var(--color-text)]" : "border-transparent opacity-65 hover:opacity-100")}
                    aria-label={`View ${product.name} image ${index + 1}`}
                  >
                    <img
                      src={optimizedSrc(url, 320)}
                      alt=""
                      onError={(event) => {
                        // Optimized copy failed: try the original before hiding the thumbnail.
                        if (event.currentTarget.getAttribute("src") !== url) event.currentTarget.src = url;
                        else markImageFailed(url);
                      }}
                      className="h-full w-full object-cover"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  </button>
                )
              ))}
            </div>
          )}

        </div>

        <div className="flex flex-col justify-center lg:py-8">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]"><BrandMark /> · Eau de Parfum</p>
          <h1 className="mt-4 font-serif text-5xl font-normal tracking-[-0.025em] sm:text-6xl">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <p className="text-base tabular-nums">{formatINR(product.price)} <span className="text-sm text-[var(--color-muted)]">· {product.size_volume}</span></p>
            {!comingSoon && <a
              href="#reviews"
              onClick={(event) => { event.preventDefault(); document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] underline-offset-4 transition-colors hover:text-[var(--color-text)] hover:underline"
            >
              {rating ? (
                <><span className="text-[var(--color-kesar)]" aria-hidden="true">★</span> {rating.average.toFixed(1)} · {rating.count} review{rating.count === 1 ? "" : "s"}</>
              ) : "Write the first review"}
            </a>}
          </div>
          {!comingSoon && <>
            <PromoLine />
            <ComboNudge
              className="mt-2"
              action={{ label: "See perfumes", onClick: () => document.getElementById("discover-more-title")?.scrollIntoView({ behavior: "smooth", block: "start" }) }}
            />
          </>}
          <p className="mt-7 max-w-xl text-sm leading-7 text-[var(--color-muted)]">{product.description}</p>

          <div className="mt-9 border-t border-[var(--color-border)] pt-6">
            {comingSoon ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-kesar)]">Coming soon</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">We're making {product.name} now. Message us and we'll tell you as soon as it's ready to order.</p>
                <a
                  href={whatsappLink(`Hi SAHUMäRIO! Please tell me when ${product.name} is available.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => pixelContact()}
                  className="mt-4 flex h-12 w-full items-center justify-between bg-[var(--color-text)] px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bg)] transition-opacity hover:opacity-85"
                >
                  <span>Ask on WhatsApp</span><span aria-hidden="true">→</span>
                </a>
              </div>
            ) : quantity === 0 ? (
              <button onClick={() => addToCart(product)} className="flex h-12 w-full items-center justify-between bg-[var(--color-text)] px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bg)] transition-opacity hover:opacity-85">
                <span>Add to bag</span><span>+</span>
              </button>
            ) : (
              <div className="grid h-12 grid-cols-[3rem_1fr_3rem] border border-[var(--color-border)]">
                <button onClick={() => updateQty(product.id, quantity - 1)} className="text-lg" aria-label={"Decrease " + product.name}>−</button>
                <span className="flex items-center justify-center text-[10px] font-semibold uppercase tracking-[0.12em]">{quantity} in bag</span>
                <button onClick={() => updateQty(product.id, quantity + 1)} className="text-lg" aria-label={"Increase " + product.name}>+</button>
              </div>
            )}
            {tester && !comingSoon && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-3">
                <p className="text-xs leading-5 text-[var(--color-muted)]">
                  <span className="font-semibold text-[var(--color-text)]">Not sure yet? Try it first.</span><br />
                  {TESTER.ml} ml tester, {formatINR(TESTER.price)} · any {TESTER.bundleSize} for {formatINR(TESTER.bundlePrice)}{" "}
                  <SpaLink href="/testers" onNavigate={() => navigate("testers")} className="underline underline-offset-4 hover:text-[var(--color-text)]">See all testers</SpaLink>
                </p>
                {testerQty === 0 ? (
                  <button type="button" onClick={() => addToCart(tester)} className="shrink-0 rounded-full border border-[var(--color-text)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition hover:bg-[var(--color-text)] hover:text-[var(--color-bg)]">Add tester</button>
                ) : (
                  <div className="grid h-9 shrink-0 grid-cols-[2rem_auto_2rem] items-center rounded-full border border-[var(--color-border)]">
                    <button type="button" onClick={() => updateQty(tester.id, testerQty - 1)} aria-label={`Fewer ${product.name} testers`}>−</button>
                    <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.1em]">{testerQty} tester{testerQty === 1 ? "" : "s"}</span>
                    <button type="button" onClick={() => updateQty(tester.id, testerQty + 1)} aria-label={`More ${product.name} testers`}>+</button>
                  </div>
                )}
              </div>
            )}
            {!isSampleSet(product) && !comingSoon && sampleSet && perfumeCount > 1 && (
              <p className="mt-4 text-xs leading-5 text-[var(--color-muted)]">
                Not sure yet?{" "}
                <SpaLink href={`/product/${sampleSet.slug}`} onNavigate={() => onProductNavigate?.(sampleSet)} className="font-semibold text-[var(--color-text)] underline underline-offset-4 hover:opacity-75">
                  Try all {perfumeCount} in the {sampleSet.name} for {formatINR(sampleSet.price)}
                </SpaLink>
              </p>
            )}
          </div>

          {productDetails.length > 0 && (
            <dl className="mt-10 border-t border-[var(--color-border)]">
              {productDetails.map(([label, value]) => (
                <div key={label} className="grid gap-2 border-b border-[var(--color-border)] py-4 sm:grid-cols-[10rem_1fr]">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</dt>
                  <dd className="whitespace-pre-line text-sm leading-6">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-8 space-y-3 border-t border-[var(--color-border)] pt-5 text-xs leading-5 text-[var(--color-muted)]">
            <p>Complimentary delivery across India.</p>
            <p>Typical delivery window: 3–7 business days.</p>
            <p>Payments are processed through Razorpay.</p>
          </div>
        </div>
      </div>

      <DiscoverMore current={product} onProductNavigate={onProductNavigate} onViewAll={() => navigate("perfumes")} />
      {/* Nobody has tried a coming-soon perfume yet, so it has no reviews section. */}
      {!comingSoon && <ProductReviews product={product} navigate={navigate} onSummary={setRating} />}
    </section>
  );
}
