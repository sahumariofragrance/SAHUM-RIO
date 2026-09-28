import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import ProductGrid from "../components/ProductGrid";
import BrandMark from "../components/BrandMark";
import SafeImage from "../components/SafeImage";
import SpaLink from "../components/SpaLink";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/cartContext";
import { formatINR } from "../utils/money";

const eyebrow = "text-[9px] font-semibold uppercase tracking-[0.3em]";
const SLIDE_MS = 6000;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function TextLink({ children, onClick, href, light = false }) {
  const className = `group inline-flex items-center gap-3 border-b pb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition-opacity hover:opacity-70 ${light ? "border-white/70 text-white" : "border-[var(--color-text)]"}`;
  const content = <>{children}<ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" /></>;
  return href ? <SpaLink href={href} onNavigate={onClick} className={className}>{content}</SpaLink> : <button type="button" onClick={onClick} className={className}>{content}</button>;
}

/** Fades sections in as they scroll into view. */
function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion() || typeof IntersectionObserver === "undefined") { setShown(true); return undefined; }
    // A fast scroll can jump past a section between observer callbacks, so
    // anything that is in or above the viewport on scroll is shown as well.
    const reached = () => node.getBoundingClientRect().top < window.innerHeight;
    const show = () => { setShown(true); observer.disconnect(); window.removeEventListener("scroll", onScroll); };
    const onScroll = () => { if (reached()) show(); };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting || reached()) show();
    }, { rootMargin: "0px 0px -10% 0px" });
    observer.observe(node);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition duration-1000 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
}

/** Full-screen hero that slowly cycles through every perfume. */
function Hero({ products, onExplore, onProductNavigate }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = products.length;

  useEffect(() => {
    if (count < 2 || paused || prefersReducedMotion()) return undefined;
    const timer = setTimeout(() => setActive((i) => (i + 1) % count), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [active, count, paused]);

  const current = products[active] || products[0];

  return (
    <section
      className="relative isolate flex min-h-[calc(100svh-110px)] items-end overflow-hidden bg-[#0f0c0a] text-white md:items-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {products.map((product, index) => (
        <SafeImage
          key={product.id}
          src={product.image}
          alt={index === active ? product.alt || product.name : ""}
          aria-hidden={index === active ? undefined : "true"}
          priority={index === 0}
          className={`absolute inset-0 -z-20 h-full w-full object-cover object-[50%_30%] transition-[opacity,transform] duration-[1800ms] ease-out md:left-auto md:w-[62%] md:object-[50%_22%] ${index === active ? "scale-100 opacity-100" : "scale-[1.06] opacity-0"}`}
        />
      ))}
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
            {current && (
              <TextLink light href={`/product/${current.slug}`} onClick={() => onProductNavigate(current)}>
                Explore {current.name}
              </TextLink>
            )}
          </div>

          {count > 1 && (
            <div className="mt-14 flex items-center gap-5" aria-label="Featured perfumes">
              <span className={`${eyebrow} tabular-nums text-white/60`}>{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
              <div className="flex gap-2">
                {products.map((product, index) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`Show ${product.name}`}
                    aria-current={index === active ? "true" : undefined}
                    className="relative h-6 w-8 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-white/25"
                  >
                    <span
                      key={index === active ? `on-${active}` : "off"}
                      className={`absolute left-0 top-1/2 h-px bg-white ${index === active ? (paused ? "w-full" : "hero-progress") : "w-0"}`}
                      style={index === active ? { animationDuration: `${SLIDE_MS}ms` } : undefined}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** A large list of names; hovering one reveals its bottle beside the list. */
function FragranceIndex({ products, onProductNavigate }) {
  const [active, setActive] = useState(0);
  const current = products[active] || products[0];
  if (!current) return null;

  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-24 sm:px-8 md:grid-cols-[1fr_0.8fr] md:gap-20 md:px-12 md:py-32">
        <Reveal>
          <p className={`${eyebrow} text-[var(--color-muted)]`}>Find your signature</p>
          <ol className="mt-10 border-t border-[var(--color-border)]">
            {products.map((product, index) => (
              <li key={product.id} className="border-b border-[var(--color-border)]">
                <SpaLink
                  href={`/product/${product.slug}`}
                  onNavigate={() => onProductNavigate(product)}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  className="group flex items-center gap-5 py-5 md:py-6"
                >
                  <span className={`${eyebrow} w-7 shrink-0 tabular-nums text-[var(--color-muted)]`}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={`min-w-0 flex-1 font-serif text-[clamp(2rem,4.2vw,3.75rem)] font-normal leading-none tracking-[-0.03em] transition duration-500 md:group-hover:translate-x-3 ${index === active ? "md:opacity-100" : "md:opacity-35"}`}>
                    <span className={index === active ? "md:italic" : ""}>{product.name}</span>
                  </span>
                  <span className="hidden text-sm tabular-nums text-[var(--color-muted)] sm:block">{formatINR(product.price)}</span>
                  <img src={product.image} alt="" loading="lazy" className="h-16 w-12 shrink-0 object-cover md:hidden" />
                  <ArrowRight className="hidden h-4 w-4 shrink-0 -translate-x-2 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:block" />
                </SpaLink>
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="hidden md:block">
          <div className="sticky top-28">
            <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-surface-muted)]">
              {products.map((product, index) => (
                <img
                  key={product.id}
                  src={product.image}
                  alt=""
                  loading="lazy"
                  className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out ${index === active ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"}`}
                />
              ))}
            </div>
            <p className="mt-5 min-h-[3.5rem] max-w-sm text-sm leading-7 text-[var(--color-muted)]">{current.description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A slow, endless ribbon of perfume names. */
function NameRibbon({ products }) {
  if (!products.length) return null;
  const names = products.map((product) => product.name);
  const row = (hidden) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden ? "true" : undefined}>
      {names.map((name, index) => (
        <span key={`${name}-${index}`} className="flex items-center">
          <span className="whitespace-nowrap px-8 font-serif text-[clamp(2rem,4vw,3.5rem)] italic leading-none md:px-12">{name}</span>
          <span className="text-white/35" aria-hidden="true">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <section className="overflow-hidden bg-[#0f0c0a] py-10 text-white md:py-14" aria-label="The collection">
      <div className="name-ribbon flex w-max">{row(false)}{row(true)}</div>
    </section>
  );
}

export default function HomePage({ onProductNavigate, setCurrentPage }) {
  const { items, addToCart, updateQty } = useCart();
  const { products: catalogueProducts, loading } = useProducts();
  const itemQtyById = useMemo(() => items.reduce((acc, item) => { acc[item.product_id] = item.qty; return acc; }, {}), [items]);
  const products = useMemo(() => catalogueProducts.map((product) => ({ ...product, qty: itemQtyById[product.id] ?? 0 })), [catalogueProducts, itemQtyById]);
  const handleAdd = useCallback((product) => addToCart(product), [addToCart]);
  const handleQty = useCallback((productId, qty) => updateQty(productId, qty), [updateQty]);

  const heroProducts = useMemo(() => products.filter((product) => product.image).slice(0, 6), [products]);
  const scrollToCollection = () => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return <>
    <Hero products={heroProducts} onExplore={scrollToCollection} onProductNavigate={onProductNavigate} />

    <div className="border-b border-[var(--color-border)]">
      <ul className="mx-auto flex max-w-[1440px] flex-col items-center justify-center gap-3 px-5 py-5 text-center sm:flex-row sm:gap-0 sm:divide-x sm:divide-[var(--color-border)] sm:px-8 md:px-12">
        {["Complimentary delivery across India", "Delivered in 3–7 business days", "Secure payments by Razorpay"].map((text) => (
          <li key={text} className={`${eyebrow} px-8 text-[var(--color-muted)]`}>{text}</li>
        ))}
      </ul>
    </div>

    <section id="collection" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-24 sm:px-8 md:px-12 md:py-32">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className={`${eyebrow} text-[var(--color-muted)]`}>The collection</p>
        <h2 className="mt-5 font-serif text-[clamp(2.8rem,5vw,4.5rem)] font-normal leading-none tracking-[-0.03em]">Eau de Parfum</h2>
        <div className="mx-auto mt-7 h-px w-12 bg-[var(--color-text)]/40" aria-hidden="true" />
      </Reveal>
      <div className="mt-16 md:mt-20"><ProductGrid products={products} loading={loading} onSelectProduct={onProductNavigate} onAddToCart={handleAdd} onUpdateQty={handleQty} /></div>
      <div className="mt-20 text-center"><TextLink href="/perfumes" onClick={() => setCurrentPage?.("perfumes")}>View all fragrances</TextLink></div>
    </section>

    <NameRibbon products={products} />

    <FragranceIndex products={products} onProductNavigate={onProductNavigate} />

    <section className="border-t border-[var(--color-border)]">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between md:px-12">
        <p className="text-sm leading-6">
          <span className={`${eyebrow} mr-4 text-[var(--color-muted)]`}>Gifting &amp; bulk orders</span>
          <span className="text-[var(--color-muted)]">Corporate gifts, weddings and events — enquiries from ₹10,000.</span>
        </p>
        <TextLink href="/bulk-orders" onClick={() => setCurrentPage?.("bulk-orders")}>Enquire</TextLink>
      </div>
    </section>
  </>;
}
