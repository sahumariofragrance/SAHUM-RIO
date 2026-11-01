import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SafeImage from "../SafeImage";
import SpaLink from "../SpaLink";

/*
 * A gallery shelf at night: each perfume hangs under its own spotlight on a
 * brass track. The perfume under the pointer lights up (the spotlight swings,
 * a warm beam falls on the bottle and a pool of light gathers under it) and
 * dims again when the pointer moves away. Inspired by a pendant-lamp rail.
 *
 * Mouse: hover lights a perfume, leaving the shelf dims it, a click opens it.
 * Touch: the shelf scrolls sideways and the perfume in the middle is lit; a
 * tap on a dim perfume brings it to the middle, a tap on the lit one opens it.
 * Until the visitor touches it, the shelf lights one perfume after another.
 *
 * items: [{ id, name, href, image, alt?, eyebrow?, description?, meta? }]
 */

const GLOW = "255,226,170"; // warm candle light
const AUTOPLAY_MS = 3200;
const FIRST_DELAY_MS = 1100;
const LAMP_H = 30;
const CORDS = [14, 26, 20, 32, 18, 28]; // varied drops, like a real track
const MAX_CORD = Math.max(...CORDS);

function usePrefers(query) {
  const [matches, setMatches] = useState(() => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false));
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, [query]);
  return matches;
}

function Spotlight({ lit }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg viewBox="0 0 40 30" width="40" height={LAMP_H} aria-hidden="true" className="block overflow-visible">
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#3A4B58" />
          <stop offset="0.45" stopColor="#1B2A35" />
          <stop offset="1" stopColor="#0B1820" />
        </linearGradient>
        <linearGradient id={`${id}-brass`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#E9D3A4" />
          <stop offset="0.6" stopColor="#B99A62" />
          <stop offset="1" stopColor="#7E6640" />
        </linearGradient>
      </defs>
      <rect x="16" y="0" width="8" height="6" rx="1.5" fill={`url(#${id}-brass)`} />
      <path d="M12 6 H28 L36 25 Q20 30 4 25 Z" fill={`url(#${id}-metal)`} />
      <path d="M12 6 H28 L29 8.5 H11 Z" fill="#E9D3A4" opacity="0.5" />
      <ellipse
        cx="20" cy="25.5" rx="15.5" ry="3.2"
        fill={`rgb(${GLOW})`}
        style={{ opacity: lit ? 1 : 0.16, filter: lit ? `drop-shadow(0 0 6px rgba(${GLOW},0.95))` : "none", transition: "opacity 400ms, filter 400ms" }}
      />
    </svg>
  );
}

export default function PerfumeSpotlightRail({
  items,
  eyebrow,
  heading,
  promptHover = "Move along the shelf to light a perfume",
  promptTouch = "Swipe along the shelf to light each perfume",
  openLabel = (item) => `Discover ${item.name}`,
  action,
  onOpen,
  autoplay = true,
  loading = false,
  className = "",
  ...rest
}) {
  const count = items.length;
  const hoverMode = usePrefers("(hover: hover) and (pointer: fine)");
  const reduced = usePrefers("(prefers-reduced-motion: reduce)");
  const [lit, setLit] = useState(null);
  const [playing, setPlaying] = useState(autoplay);
  const [inView, setInView] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: false });
  const sectionRef = useRef(null);
  const scrollerRef = useRef(null);
  const cards = useRef([]);
  const fixtures = useRef([]);
  const swings = useRef([]);
  const litRef = useRef(null);
  const pointerX = useRef(null);
  const frame = useRef(0);

  const swing = useCallback((index, amplitude) => {
    const el = fixtures.current[index];
    if (!el || reduced || !el.animate) return;
    swings.current[index]?.cancel();
    swings.current[index] = el.animate([
      { transform: "rotate(0deg)" },
      { transform: `rotate(${amplitude}deg)`, offset: 0.2 },
      { transform: `rotate(${-amplitude * 0.55}deg)`, offset: 0.48 },
      { transform: `rotate(${amplitude * 0.25}deg)`, offset: 0.74 },
      { transform: "rotate(0deg)" },
    ], { duration: 1500, easing: "ease-out" });
  }, [reduced]);

  /* Light one perfume (or none); its spotlight swings and the neighbours get a small nudge. */
  const light = useCallback((index, direction = 1) => {
    if (litRef.current === index) return;
    litRef.current = index;
    setLit(index);
    if (index === null) return;
    swing(index, 7 * direction);
    swing(index - 1, -2.5 * direction);
    swing(index + 1, -2.5 * direction);
  }, [swing]);

  const stop = useCallback(() => setPlaying(false), []);

  const center = useCallback((index, smooth = true) => {
    const scroller = scrollerRef.current;
    const card = cards.current[index];
    if (!scroller || !card) return;
    const left = card.offsetLeft + card.offsetWidth / 2 - scroller.clientWidth / 2;
    scroller.scrollTo({ left, behavior: smooth && !reduced ? "smooth" : "auto" });
  }, [reduced]);

  /* Scroll just enough to show a card (mouse mode autoplay). */
  const reveal = useCallback((index) => {
    const scroller = scrollerRef.current;
    const card = cards.current[index];
    if (!scroller || !card) return;
    const left = card.offsetLeft - 24;
    const right = card.offsetLeft + card.offsetWidth + 24 - scroller.clientWidth;
    if (scroller.scrollLeft > left) scroller.scrollTo({ left, behavior: reduced ? "auto" : "smooth" });
    else if (scroller.scrollLeft < right) scroller.scrollTo({ left: right, behavior: reduced ? "auto" : "smooth" });
  }, [reduced]);

  /* Touch: the card nearest the middle of the shelf is the lit one. */
  const lightCentred = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const middle = scroller.scrollLeft + scroller.clientWidth / 2;
    let best = null;
    let distance = Infinity;
    cards.current.forEach((card, index) => {
      if (!card) return;
      const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - middle);
      if (d < distance) { best = index; distance = d; }
    });
    if (best !== null) light(best, best > (litRef.current ?? -1) ? 1 : -1);
  }, [light]);

  const onScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      setEdges({ start: scroller.scrollLeft < 8, end: scroller.scrollLeft + scroller.clientWidth > scroller.scrollWidth - 8 });
      if (!hoverMode) lightCentred();
    });
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // Touch mode starts with the perfume in the middle lit; mouse mode starts dark.
  useEffect(() => {
    if (!count) return;
    if (!hoverMode) lightCentred();
    onScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverMode, count]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") { setInView(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => { setPlaying(autoplay); }, [autoplay]);

  // Autoplay: one perfume after another until the visitor interacts.
  useEffect(() => {
    if (!playing || !inView || reduced || count < 2) return undefined;
    const timer = window.setTimeout(() => {
      if (document.hidden) return;
      const current = litRef.current;
      const next = current === null ? 0 : (current + 1) % count;
      if (hoverMode) { light(next, 1); reveal(next); }
      else center(next);
    }, litRef.current === null ? FIRST_DELAY_MS : AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [playing, inView, reduced, count, hoverMode, lit, light, reveal, center]);

  const scrollBy = (direction) => {
    stop();
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.75, behavior: reduced ? "auto" : "smooth" });
  };

  const current = lit === null ? null : items[lit] || null;

  return (
    <section
      ref={sectionRef}
      {...rest}
      data-slot="perfume-spotlight-rail"
      data-mode={hoverMode ? "hover" : "touch"}
      className={`relative isolate overflow-hidden bg-[#06141B] text-[#E8EBEA] ${className}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(70% 55% at 50% 40%, #12232E 0%, #06141B 70%)" }} />
      {(eyebrow || heading) && (
        <header className="mx-auto max-w-2xl px-6 pt-14 text-center md:pt-20">
          {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#E9D3A4]/80">{eyebrow}</p>}
          {heading && <h2 className="mt-4 text-balance font-serif text-[clamp(1.9rem,3.6vw,3rem)] font-normal leading-[1.08] tracking-[-0.01em]">{heading}</h2>}
        </header>
      )}

      <div className="relative mt-10 md:mt-12">
        {/* The brass track the spotlights hang from. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[6px]" style={{ background: "linear-gradient(to bottom, #F3E3BE 0%, #C9AE78 35%, #8C7349 75%, #5E4C30 100%)", boxShadow: "0 3px 10px rgba(0,0,0,0.55)" }} />

        <div
          ref={scrollerRef}
          role="group"
          aria-label={heading || "Perfumes"}
          className="scrollbar-hide relative flex snap-x snap-mandatory gap-5 overflow-x-auto px-[21vw] pb-2 sm:snap-none sm:gap-8 sm:px-12"
          onScroll={onScroll}
          onPointerDown={stop}
          onWheel={(event) => { if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) stop(); }}
          onPointerMove={(event) => { if (event.pointerType === "mouse") pointerX.current = event.clientX; }}
          onPointerLeave={(event) => {
            // Moving the mouse off the shelf dims the perfumes again (once the visitor has taken over).
            if (event.pointerType === "mouse" && hoverMode && !playing) light(null);
          }}
        >
          {loading && !count && Array.from({ length: 6 }, (_, index) => (
            <div key={`placeholder-${index}`} aria-hidden="true" className="flex w-[58vw] max-w-[15rem] shrink-0 flex-col items-center sm:w-[12.5rem] lg:w-[13.5rem]">
              <span style={{ height: 6 + MAX_CORD + LAMP_H }} />
              <span className="mt-2 aspect-[4/5] w-full animate-pulse rounded-[1.25rem] bg-white/5" />
            </div>
          ))}
          {items.map((item, index) => {
            const on = lit === index;
            const cord = CORDS[index % CORDS.length];
            const mouth = 6 + cord + LAMP_H - 5;
            return (
              <div
                key={item.id}
                ref={(node) => { cards.current[index] = node; }}
                data-lit={on ? "true" : "false"}
                className="relative flex w-[58vw] max-w-[15rem] shrink-0 snap-center flex-col items-center sm:w-[12.5rem] lg:w-[13.5rem]"
                onPointerEnter={(event) => {
                  if (event.pointerType !== "mouse") return;
                  stop();
                  const from = pointerX.current;
                  light(index, from !== null && event.clientX < from ? -1 : 1);
                }}
              >
                {/* Cord and spotlight; the whole fixture swings from the track. */}
                <span ref={(node) => { fixtures.current[index] = node; }} aria-hidden="true" className="relative z-10 flex origin-top flex-col items-center" style={{ paddingTop: 6, height: 6 + MAX_CORD + LAMP_H }}>
                  <span className="w-[2px] rounded-b-full" style={{ height: cord, background: "linear-gradient(to bottom, #6B5B3E, #2A2A2A)" }} />
                  <Spotlight lit={on} />
                </span>

                {/* The beam falling on the perfume. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute z-20 transition-opacity duration-500 ease-out"
                  style={{
                    top: mouth,
                    left: "-22%",
                    width: "144%",
                    bottom: 36,
                    clipPath: "polygon(43% 0, 57% 0, 100% 100%, 0 100%)",
                    background: `linear-gradient(to bottom, rgba(${GLOW},0.5), rgba(${GLOW},0.14) 55%, rgba(${GLOW},0.02))`,
                    mixBlendMode: "screen",
                    opacity: on ? 0.75 : 0,
                  }}
                />

                <SpaLink
                  href={item.href}
                  onNavigate={() => onOpen?.(item)}
                  onFocus={(event) => {
                    // Keyboard focus lights the perfume (a tap or click focuses too, but is handled below).
                    if (!event.currentTarget.matches(":focus-visible")) return;
                    stop();
                    light(index);
                  }}
                  onClick={(event) => {
                    // Touch: a tap on a dim perfume brings it to the middle first.
                    if (!hoverMode && litRef.current !== index) { event.preventDefault(); stop(); center(index); }
                  }}
                  aria-label={item.name}
                  className="relative mt-2 block aspect-[4/5] w-full overflow-hidden rounded-[1.25rem] outline-none ring-[#E9D3A4] ring-offset-2 ring-offset-[#06141B] transition-[filter,transform,box-shadow] duration-700 ease-out focus-visible:ring-2"
                  style={{
                    filter: on ? "brightness(1.05) saturate(1.05)" : "brightness(0.34) saturate(0.5)",
                    transform: on ? "translateY(-6px)" : "none",
                    boxShadow: on ? `0 30px 70px -26px rgba(${GLOW},0.6), 0 0 0 1px rgba(${GLOW},0.35)` : "0 0 0 1px rgba(255,255,255,0.05)",
                  }}
                >
                  <SafeImage src={item.image} alt={item.alt || item.name} sizes="(min-width: 640px) 216px, 58vw" maxWidth={640} className="absolute inset-0 h-full w-full object-cover" />
                  {item.eyebrow && (
                    <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-[#11212D]/85 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#E9D3A4] transition-opacity duration-500" style={{ opacity: on ? 1 : 0 }}>
                      {item.eyebrow}
                    </span>
                  )}
                </SpaLink>

                {/* Pool of light under the perfume. */}
                <span aria-hidden="true" className="pointer-events-none mt-3 h-6 w-[92%] rounded-[50%] transition-opacity duration-700" style={{ background: `radial-gradient(closest-side, rgba(${GLOW},0.5), rgba(${GLOW},0.12) 60%, transparent)`, opacity: on ? 1 : 0.06 }} />
                {/* Phones show the lit perfume's name in the caption below instead. */}
                <p className="mt-1 hidden font-serif text-lg leading-6 transition-colors duration-500 sm:block" style={{ color: on ? "#F5EBD6" : "rgba(232,235,234,0.38)" }}>{item.name}</p>
              </div>
            );
          })}
        </div>

        {hoverMode && count > 0 && (
          <>
            {!edges.start && (
              <button type="button" onClick={() => scrollBy(-1)} className="absolute left-3 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#06141B]/80 text-[#E8EBEA] backdrop-blur transition hover:border-[#E9D3A4]/60 sm:flex" aria-label="Show earlier perfumes">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {!edges.end && (
              <button type="button" onClick={() => scrollBy(1)} className="absolute right-3 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#06141B]/80 text-[#E8EBEA] backdrop-blur transition hover:border-[#E9D3A4]/60 sm:flex" aria-label="Show more perfumes">
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>

      <div className="mx-auto flex max-w-xl flex-col items-center px-6 pb-14 pt-6 text-center md:pb-20">
        <div aria-live="polite" className="min-h-[7.5rem]">
          {current ? (
            <>
              {current.eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E9D3A4]">{current.eyebrow}</p>}
              <p className="mt-2 font-serif text-[2rem] leading-none">{current.name}</p>
              {current.description && <p className="mx-auto mt-3 max-w-[34ch] text-sm leading-6 text-[#E8EBEA]/70">{current.description}</p>}
              {current.meta && <p className="mt-2 text-xs tracking-[0.04em] text-[#E8EBEA]/50">{current.meta}</p>}
            </>
          ) : (
            <p className="pt-8 text-sm text-[#E8EBEA]/60">{hoverMode ? promptHover : promptTouch}</p>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action}
          {current && (
            <SpaLink href={current.href} onNavigate={() => onOpen?.(current)} className="inline-flex h-11 items-center rounded-full border border-[#E8EBEA]/30 px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E8EBEA] transition hover:border-[#E9D3A4] hover:text-[#F5EBD6]">
              {openLabel(current)}
            </SpaLink>
          )}
        </div>
      </div>
    </section>
  );
}
