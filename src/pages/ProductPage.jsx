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
import { pixelViewContent } from "../lib/metaPixel";
import { productJsonLd } from "../seo/site";
import { setPageJsonLd } from "../seo/head";
import { useTheme } from "../context/ThemeContext";
import { loadImageHue, tonePalette } from "../utils/imageTone";
import { optimizedSrc } from "../utils/optimizedImage";

export default function ProductPage({ slug, navigate, onProductNavigate }) {
  const { items, addToCart, updateQty } = useCart();
  const { bySlug, loading } = useProducts();
  const product = useMemo(() => bySlug.get(slug) || null, [bySlug, slug]);
  const { theme } = useTheme();

  // Tint the whole page with the dominant colour of the perfume's photo.
  const toneImage = product?.image_url || product?.image;
  useEffect(() => {
    if (!toneImage) return undefined;
    let cancelled = false;
    const root = document.documentElement;
    let applied = [];
    loadImageHue(toneImage).then((hue) => {
      if (cancelled || !hue) return;
      const palette = tonePalette(hue, theme);
      Object.entries(palette).forEach(([name, value]) => root.style.setProperty(name, value));
      applied = Object.keys(palette);
      root.setAttribute("data-product-tone", "");
    });
    return () => {
      cancelled = true;
      applied.forEach((name) => root.style.removeProperty(name));
      root.removeAttribute("data-product-tone");
    };
  }, [toneImage, theme]);
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
  const productDetails = product ? [
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
            <a
              href="#reviews"
              onClick={(event) => { event.preventDefault(); document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] underline-offset-4 transition-colors hover:text-[var(--color-text)] hover:underline"
            >
              {rating ? (
                <><span className="text-[var(--color-kesar)]" aria-hidden="true">★</span> {rating.average.toFixed(1)} · {rating.count} review{rating.count === 1 ? "" : "s"}</>
              ) : "Write the first review"}
            </a>
          </div>
          <PromoLine />
          <ComboNudge
            className="mt-2"
            action={{ label: "See perfumes", onClick: () => document.getElementById("discover-more-title")?.scrollIntoView({ behavior: "smooth", block: "start" }) }}
          />
          <p className="mt-7 max-w-xl text-sm leading-7 text-[var(--color-muted)]">{product.description}</p>

          <div className="mt-9 border-t border-[var(--color-border)] pt-6">
            {quantity === 0 ? (
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
      <ProductReviews product={product} navigate={navigate} onSummary={setRating} />
    </section>
  );
}
