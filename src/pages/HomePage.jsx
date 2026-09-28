import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import ProductGrid from "../components/ProductGrid";
import BrandMark from "../components/BrandMark";
import SpaLink from "../components/SpaLink";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/cartContext";
import { formatINR } from "../utils/money";
import { loadImageHue } from "../utils/imageTone";

const eyebrow = "text-[9px] font-semibold uppercase tracking-[0.3em]";
const AUTOPLAY_MS = 7000;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function TextLink({ children, onClick, href }) {
  const className = "group inline-flex items-center gap-3 border-b border-current pb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition-opacity hover:opacity-70";
  const content = <>{children}<ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" /></>;
  return href ? <SpaLink href={href} onNavigate={onClick} className={className}>{content}</SpaLink> : <button type="button" onClick={onClick} className={className}>{content}</button>;
}

/** Fades content in the first time it scrolls into view. */
function Reveal({ children, className = "" }) {
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
    <div ref={ref} className={`transition duration-1000 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
}

/** Background colour for the stage, taken from the perfume's photo. */
function stageColour(hue, theme) {
  if (!hue) return theme === "light" ? "hsl(30 20% 93%)" : "hsl(24 12% 7%)";
  const s = Math.round(Math.min(hue.s, 0.55) * 100);
  return theme === "light" ? `hsl(${hue.h} ${Math.round(s * 0.7)}% 90%)` : `hsl(${hue.h} ${Math.round(s * 0.8)}% 11%)`;
}

function useTheme() {
  const read = () => (typeof document !== "undefined" && document.documentElement.dataset.theme === "light" ? "light" : "dark");
  const [theme, setTheme] = useState(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

/**
 * The homepage stage: one bottle at a time under an arch, its name drawn
 * large behind it, the whole screen taking on the bottle's colour. Visitors
 * choose a perfume by name, arrow keys or a swipe; the arch follows the cursor.
 */
function Stage({ products, onProductNavigate }) {
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const [hues, setHues] = useState({});
  const theme = useTheme();
  const stageRef = useRef(null);
  const swipeRef = useRef(null);
  const count = products.length;
  const current = products[active] || products[0];

  useEffect(() => {
    let cancelled = false;
    products.forEach((product) => {
      loadImageHue(product.image).then((hue) => {
        if (!cancelled) setHues((previous) => ({ ...previous, [product.id]: hue }));
      });
    });
    return () => { cancelled = true; };
  }, [products]);

  // Moves through the collection on its own until the visitor takes over.
  useEffect(() => {
    if (touched || count < 2 || prefersReducedMotion()) return undefined;
    const timer = setTimeout(() => setActive((index) => (index + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [active, count, touched]);

  // Keeps the chosen name in view in the (scrollable, on phones) name row.
  const namesRef = useRef(null);
  useEffect(() => {
    const list = namesRef.current;
    const item = list?.children[active];
    if (!list || !item || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [active]);

  const choose = useCallback((index) => {
    setTouched(true);
    setActive(((index % count) + count) % count);
  }, [count]);

  const onPointerMove = (event) => {
    if (event.pointerType !== "mouse" || prefersReducedMotion()) return;
    const rect = stageRef.current.getBoundingClientRect();
    stageRef.current.style.setProperty("--mx", (((event.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3));
    stageRef.current.style.setProperty("--my", (((event.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3));
  };
  const onPointerLeave = () => {
    stageRef.current?.style.setProperty("--mx", "0");
    stageRef.current?.style.setProperty("--my", "0");
  };
  const onPointerDown = (event) => { if (event.pointerType !== "mouse") swipeRef.current = event.clientX; };
  const onPointerUp = (event) => {
    if (swipeRef.current === null) return;
    const distance = event.clientX - swipeRef.current;
    swipeRef.current = null;
    if (Math.abs(distance) > 50) choose(active + (distance < 0 ? 1 : -1));
  };
  const onKeyDown = (event) => {
    if (event.key === "ArrowRight") { event.preventDefault(); choose(active + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); choose(active - 1); }
  };

  if (!current) return <section className="min-h-[calc(100svh-110px)] bg-[var(--color-bg)]" />;
  const href = `/product/${current.slug}`;

  return (
    <section
      ref={stageRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
      aria-roledescription="carousel"
      aria-label="Choose a fragrance"
      style={{ backgroundColor: stageColour(hues[current.id], theme) }}
      className="stage relative isolate flex min-h-[calc(100svh-110px)] touch-pan-y select-none flex-col overflow-hidden transition-colors duration-[1400ms] ease-out"
    >
      <div className="relative z-10 flex items-start justify-between px-5 pt-8 sm:px-8 md:absolute md:inset-x-0 md:top-0 md:px-12 md:pt-10">
        <div>
          <p className={`${eyebrow} text-[var(--color-muted)]`}><BrandMark /> · Eau de Parfum</p>
          <h1 className="mt-3 font-serif text-xl font-normal italic leading-tight md:text-2xl">
            <span className="sr-only">SAHUMäRIO® Eau de Parfum — </span>The art of lasting fragrance
          </h1>
        </div>
        <p className={`${eyebrow} hidden pt-1 tabular-nums text-[var(--color-muted)] sm:block`}>
          {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </p>
      </div>

      <div className="relative flex flex-1 items-center justify-center py-6 md:pt-10">
        {/* The name, drawn large behind the bottle. */}
        <p
          key={`name-${current.id}`}
          aria-hidden="true"
          className="stage-name stage-in pointer-events-none absolute inset-x-0 top-1/2 -z-10 whitespace-nowrap text-center font-serif text-[clamp(4.5rem,17vw,17rem)] italic leading-none tracking-[-0.04em] opacity-[0.12]"
        >
          {current.name}
        </p>

        <SpaLink href={href} onNavigate={() => onProductNavigate(current)} aria-label={`Discover ${current.name}`} className="stage-arch group relative block aspect-[3/4] h-[clamp(260px,calc(100svh-480px),600px)] md:h-[clamp(300px,calc(100svh-420px),600px)] overflow-hidden rounded-t-full shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]">
          {products.map((product, index) => (
            <img
              key={product.id}
              src={product.image}
              alt={index === active ? product.alt || product.name : ""}
              aria-hidden={index === active ? undefined : "true"}
              loading={index === 0 ? "eager" : "lazy"}
              fetchpriority={index === 0 ? "high" : "auto"}
              decoding="async"
              draggable="false"
              className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1200ms] ease-out group-hover:scale-[1.04] ${index === active ? "opacity-100" : "scale-[1.06] opacity-0"}`}
            />
          ))}
        </SpaLink>
      </div>

      <div className="relative z-10 px-5 pb-8 sm:px-8 md:px-12 md:pb-10">
        <div key={`info-${current.id}`} className="stage-in mx-auto flex max-w-md flex-col items-center text-center">
          <h2 className="font-serif text-[2.1rem] font-normal leading-none tracking-[-0.02em]">{current.name}</h2>
          {current.description && <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{current.description}</p>}
          <div className="mt-5 flex items-center gap-6">
            <TextLink href={href} onClick={() => onProductNavigate(current)}>Discover</TextLink>
            <span className="text-sm tabular-nums text-[var(--color-muted)]">{formatINR(current.price)}</span>
          </div>
        </div>

        {count > 1 && (
          <nav aria-label="Fragrances" className="mt-6 flex justify-center">
            <ul ref={namesRef} className="scrollbar-hide relative flex max-w-full gap-6 overflow-x-auto px-2 md:gap-9">
              {products.map((product, index) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => choose(index)}
                    onMouseEnter={() => choose(index)}
                    aria-current={index === active ? "true" : undefined}
                    className={`relative whitespace-nowrap py-2 text-[10px] font-semibold uppercase tracking-[0.22em] transition-opacity duration-300 ${index === active ? "opacity-100" : "opacity-40 hover:opacity-80"}`}
                  >
                    {product.name}
                    <span className={`absolute inset-x-0 bottom-0 h-px origin-left bg-current transition-transform duration-500 ${index === active ? "scale-x-100" : "scale-x-0"}`} />
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
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
  const stageProducts = useMemo(() => catalogueProducts.filter((product) => product.image), [catalogueProducts]);

  return <>
    <Stage products={stageProducts} onProductNavigate={onProductNavigate} />

    <section id="collection" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-28 sm:px-8 md:px-12 md:py-40">
      <Reveal className="mb-16 flex items-end justify-between gap-6 md:mb-20">
        <h2 className="font-serif text-[clamp(2.4rem,4vw,3.5rem)] font-normal leading-none tracking-[-0.03em]">The collection</h2>
        <TextLink href="/perfumes" onClick={() => setCurrentPage?.("perfumes")}>View all</TextLink>
      </Reveal>
      <ProductGrid products={products} loading={loading} onSelectProduct={onProductNavigate} onAddToCart={handleAdd} onUpdateQty={handleQty} />
    </section>

    <section className="mx-auto max-w-[1440px] px-5 pb-24 sm:px-8 md:px-12 md:pb-32">
      <div className="flex flex-col gap-5 border-t border-[var(--color-border)] pt-10 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-6 text-[var(--color-muted)]">Gifting for weddings, corporate and events — enquiries from ₹10,000.</p>
        <TextLink href="/bulk-orders" onClick={() => setCurrentPage?.("bulk-orders")}>Bulk orders</TextLink>
      </div>
    </section>
  </>;
}
