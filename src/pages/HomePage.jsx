import React, { useCallback, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import ProductGrid from "../components/ProductGrid";
import BrandMark from "../components/BrandMark";
import SafeImage from "../components/SafeImage";
import SpaLink from "../components/SpaLink";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/cartContext";
import { formatINR } from "../utils/money";

const eyebrow = "text-[9px] font-semibold uppercase tracking-[0.3em]";

function TextLink({ children, onClick, href, light = false }) {
  const className = `group inline-flex items-center gap-3 border-b pb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition-opacity hover:opacity-70 ${light ? "border-white/70 text-white" : "border-[var(--color-text)]"}`;
  const content = <>{children}<ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" /></>;
  return href ? <SpaLink href={href} onNavigate={onClick} className={className}>{content}</SpaLink> : <button type="button" onClick={onClick} className={className}>{content}</button>;
}

function Hero({ featured, onExplore, onProductNavigate }) {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-110px)] items-end overflow-hidden bg-[#0f0c0a] text-white md:items-center">
      {featured?.image && (
        <SafeImage src={featured.image} alt={featured.alt || featured.name} priority className="absolute inset-0 -z-20 h-full w-full object-cover object-[50%_30%] md:left-auto md:w-[62%] md:object-[50%_22%]" />
      )}
      {/* Fade the photo into the dark background so the headline stays readable. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0f0c0a] via-[#0f0c0a]/70 to-transparent md:bg-gradient-to-r md:from-[#0f0c0a] md:from-[38%] md:via-[#0f0c0a]/75 md:via-[52%] md:to-transparent" aria-hidden="true" />

      <div className="mx-auto w-full max-w-[1440px] px-5 pb-14 pt-40 sm:px-8 md:px-12 md:py-24">
        <div className="max-w-xl">
          <p className={`${eyebrow} text-white/70`}><BrandMark /> · Eau de Parfum</p>
          <h1 className="mt-6 font-serif text-[clamp(3.2rem,7vw,7rem)] font-normal leading-[0.92] tracking-[-0.035em]">
            <span className="sr-only">SAHUMäRIO® Eau de Parfum — </span>
            The art of
            <span className="block italic">lasting fragrance</span>
          </h1>
          <p className="mt-7 max-w-md text-sm leading-7 text-white/75">
            A focused collection of Eau de Parfum from Rajkot, Gujarat — each with its own name, character and identity, delivered free across India.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
            <button type="button" onClick={onExplore} className="inline-flex h-12 items-center gap-3 bg-white px-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0f0c0a] transition hover:bg-white/85">
              Discover the collection
            </button>
            {featured && (
              <TextLink light href={`/product/${featured.slug}`} onClick={() => onProductNavigate(featured)}>
                Explore {featured.name}
              </TextLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Spotlight({ product, index, onProductNavigate }) {
  const reverse = index % 2 === 1;
  const image = (Array.isArray(product.gallery) && product.gallery[1]) || product.image;
  const details = [product.scent_profile, product.fragrance_family].filter(Boolean).join(" · ");
  return (
    <article className="grid items-center gap-10 md:grid-cols-2 md:gap-16 lg:gap-24">
      <SpaLink href={`/product/${product.slug}`} onNavigate={() => onProductNavigate(product)} tabIndex={-1} aria-hidden="true" className={`group block overflow-hidden ${reverse ? "md:order-2" : ""}`}>
        <div className="aspect-[4/5] overflow-hidden bg-[var(--color-surface-muted)]">
          <SafeImage src={image} alt={product.alt || product.name} className="h-full w-full object-cover transition duration-[1600ms] ease-out group-hover:scale-[1.03]" />
        </div>
      </SpaLink>
      <div className={`max-w-md ${reverse ? "md:order-1 md:justify-self-end" : ""}`}>
        <p className={`${eyebrow} text-[var(--color-muted)]`}>{String(index + 1).padStart(2, "0")} · Signature</p>
        <h3 className="mt-5 font-serif text-[clamp(3rem,5vw,4.75rem)] font-normal leading-[0.95] tracking-[-0.03em]">{product.name}</h3>
        {product.description && <p className="mt-6 text-sm leading-7 text-[var(--color-muted)]">{product.description}</p>}
        {details && <p className={`${eyebrow} mt-5`}>{details}</p>}
        <div className="mt-9 flex items-center gap-8">
          <TextLink href={`/product/${product.slug}`} onClick={() => onProductNavigate(product)}>Discover {product.name}</TextLink>
          <span className="text-sm tabular-nums text-[var(--color-muted)]">{formatINR(product.price)}</span>
        </div>
      </div>
    </article>
  );
}

export default function HomePage({ onProductNavigate, setCurrentPage }) {
  const { items, addToCart, updateQty } = useCart();
  const { products: catalogueProducts, loading } = useProducts();
  const itemQtyById = useMemo(() => items.reduce((acc, item) => { acc[item.product_id] = item.qty; return acc; }, {}), [items]);
  const products = useMemo(() => catalogueProducts.map((product) => ({ ...product, qty: itemQtyById[product.id] ?? 0 })), [catalogueProducts, itemQtyById]);
  const handleAdd = useCallback((product) => addToCart(product), [addToCart]);
  const handleQty = useCallback((productId, qty) => updateQty(productId, qty), [updateQty]);

  const featured = products[0] || null;
  const spotlights = products.slice(1, 3);
  const scrollToCollection = () => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return <>
    <Hero featured={featured} onExplore={scrollToCollection} onProductNavigate={onProductNavigate} />

    <div className="border-b border-[var(--color-border)]">
      <ul className="mx-auto flex max-w-[1440px] flex-col items-center justify-center gap-3 px-5 py-5 text-center sm:flex-row sm:gap-0 sm:divide-x sm:divide-[var(--color-border)] sm:px-8 md:px-12">
        {["Complimentary delivery across India", "Delivered in 3–7 business days", "Secure payments by Razorpay"].map((text) => (
          <li key={text} className={`${eyebrow} px-8 text-[var(--color-muted)]`}>{text}</li>
        ))}
      </ul>
    </div>

    <section id="collection" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-24 sm:px-8 md:px-12 md:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <p className={`${eyebrow} text-[var(--color-muted)]`}>The collection</p>
        <h2 className="mt-5 font-serif text-[clamp(2.8rem,5vw,4.5rem)] font-normal leading-none tracking-[-0.03em]">Eau de Parfum</h2>
        <div className="mx-auto mt-7 h-px w-12 bg-[var(--color-text)]/40" aria-hidden="true" />
      </div>
      <div className="mt-16 md:mt-20"><ProductGrid products={products} loading={loading} onSelectProduct={onProductNavigate} onAddToCart={handleAdd} onUpdateQty={handleQty} /></div>
      <div className="mt-20 text-center"><TextLink href="/perfumes" onClick={() => setCurrentPage?.("perfumes")}>View all fragrances</TextLink></div>
    </section>

    {spotlights.length > 0 && (
      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-[1440px] space-y-24 px-5 py-24 sm:px-8 md:space-y-36 md:px-12 md:py-36">
          {spotlights.map((product, index) => (
            <Spotlight key={product.id} product={product} index={index} onProductNavigate={onProductNavigate} />
          ))}
        </div>
      </section>
    )}

    <section className="bg-[#0f0c0a] px-5 py-28 text-center text-white sm:px-8 md:py-40">
      <p className={`${eyebrow} text-white/55`}>The House</p>
      <blockquote className="mx-auto mt-9 max-w-4xl font-serif text-[clamp(2.4rem,5vw,5.25rem)] font-normal leading-[1] tracking-[-0.03em]">
        A fragrance should be
        <span className="block italic text-white/80">discovered, not explained.</span>
      </blockquote>
      <div className="mx-auto mt-12 h-px w-12 bg-white/35" aria-hidden="true" />
      <BrandMark className={`${eyebrow} mt-6 block text-white/55`} />
    </section>

    <section className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 md:px-12 md:py-32">
      <div className="grid items-end gap-10 border-t border-[var(--color-border)] pt-14 md:grid-cols-[1.2fr_1fr] md:gap-16">
        <div>
          <p className={`${eyebrow} text-[var(--color-muted)]`}>Gifting · Corporate · Weddings</p>
          <h2 className="mt-5 font-serif text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[0.98] tracking-[-0.03em]">
            Fragrance, <span className="italic">at scale.</span>
          </h2>
        </div>
        <div>
          <p className="max-w-md text-sm leading-7 text-[var(--color-muted)]">
            Order SAHUMäRIO® Eau de Parfum in bulk for corporate gifting, weddings and events. Enquiries for orders from ₹10,000.
          </p>
          <div className="mt-8"><TextLink href="/bulk-orders" onClick={() => setCurrentPage?.("bulk-orders")}>Enquire about bulk orders</TextLink></div>
        </div>
      </div>
    </section>
  </>;
}
