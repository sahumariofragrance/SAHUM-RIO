"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BrandMark from "../src/components/BrandMark";
import SafeImage from "../src/components/SafeImage";
import { formatINR } from "../src/utils/money";
import { useCart } from "./cart";

export default function ProductDetail({ product, galleryUrls }) {
  const { items, addToCart, updateQty } = useCart();
  const [activeImage, setActiveImage] = useState(product.image);
  const [failed, setFailed] = useState([]);

  useEffect(() => {
    setActiveImage(product.image);
    setFailed([]);
  }, [product.id, product.image]);

  const visible = useMemo(() => galleryUrls.filter(url => !failed.includes(url)), [galleryUrls, failed]);
  const quantity = items.find(item => item.product_id === product.id)?.qty || 0;

  const details = [
    ["Size / volume", product.size_volume],
    ["Fragrance family", product.fragrance_family],
    ["Scent profile", product.scent_profile],
    ["Occasion", product.occasion],
    ["Fragrance notes", product.notes],
  ].filter(([, value]) => String(value || "").trim());

  function fail(url) {
    setFailed(current => current.includes(url) ? current : [...current, url]);
    if (activeImage === url) setActiveImage(product.image);
  }

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 md:px-12 md:py-12">
      <Link href="/perfumes" className="mb-8 inline-block text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)] transition hover:text-[var(--color-text)]">← All fragrances</Link>
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          <div className="min-h-[560px] overflow-hidden bg-[var(--color-surface-muted)]">
            <SafeImage src={activeImage || product.image} alt={product.alt || product.name} className="h-full w-full object-cover" priority />
          </div>

          {visible.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2" aria-label={`${product.name} image gallery`}>
              {galleryUrls.map((url, index) => !failed.includes(url) && (
                <button key={url} type="button" onClick={() => setActiveImage(url)} className={"relative aspect-[4/5] overflow-hidden border transition " + (activeImage === url ? "border-[var(--color-text)]" : "border-transparent opacity-65 hover:opacity-100")}>
                  <img src={url} alt="" onError={() => fail(url)} className="h-full w-full object-cover" loading={index === 0 ? "eager" : "lazy"} />
                </button>
              ))}
            </div>
          )}

          <div className="hidden">
            {galleryUrls.map(url => !failed.includes(url) && <img key={`probe-${url}`} src={url} alt="" onError={() => fail(url)} />)}
          </div>
        </div>

        <div className="flex flex-col justify-center lg:py-8">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]"><BrandMark /> · Eau de Parfum</p>
          <h1 className="mt-4 font-serif text-5xl font-normal tracking-[-0.025em] sm:text-6xl">{product.name}</h1>
          <p className="mt-4 text-base">{formatINR(product.price)}</p>
          <p className="mt-7 max-w-xl text-sm leading-7 text-[var(--color-muted)]">{product.description}</p>

          <div className="mt-9 border-t border-[var(--color-border)] pt-6">
            {quantity === 0 ? (
              <button onClick={() => addToCart(product)} className="flex h-12 w-full items-center justify-between bg-[var(--color-text)] px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bg)]"><span>Add to bag</span><span>+</span></button>
            ) : (
              <div className="grid h-12 grid-cols-[3rem_1fr_3rem] border border-[var(--color-border)]">
                <button onClick={() => updateQty(product.id, quantity - 1)} className="text-lg">−</button>
                <span className="flex items-center justify-center text-[10px] font-semibold uppercase tracking-[0.12em]">{quantity} in bag</span>
                <button onClick={() => updateQty(product.id, quantity + 1)} className="text-lg">+</button>
              </div>
            )}
          </div>

          {details.length > 0 && <dl className="mt-10 border-t border-[var(--color-border)]">{details.map(([label, value]) => <div key={label} className="grid gap-2 border-b border-[var(--color-border)] py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</dt><dd className="whitespace-pre-line text-sm leading-6">{value}</dd></div>)}</dl>}

          <div className="mt-8 space-y-3 border-t border-[var(--color-border)] pt-5 text-xs leading-5 text-[var(--color-muted)]">
            <p>Complimentary delivery across India.</p>
            <p>Typical delivery window: 3–7 business days.</p>
            <p>Payments are processed through Razorpay.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
