import React, { useCallback, useEffect, useRef, useState } from "react";
import SafeImage from "../SafeImage";
import SpaLink from "../SpaLink";

/*
 * A short row of perfumes that scrolls sideways. Hovering a bottle sprays it
 * once: a puff of mist and fine droplets from the top of the bottle. Phones
 * have no hover, so there the bottle that settles in the middle of the row
 * sprays. A click or tap opens the perfume.
 *
 * items: [{ id, name, href, image, alt?, badge?, description?, meta? }]
 */

const SPRAY_MS = 1800;
// Where the mist leaves the bottle in the product photos (bottle centred, cap near the top):
// just right of the top of the cap, spraying to the right and a little upwards.
const NOZZLE = { x: 0.57, y: 0.18 };
const EASE_OUT = "cubic-bezier(.16,.84,.3,1)";

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

const random = (min, max) => min + Math.random() * (max - min);
const RAD = Math.PI / 180;

/**
 * One spray into `layer`: a short jet from the nozzle, mist clouds that
 * spread and hang for a moment, a haze that softens the photo behind it
 * (so the spray shows on light photos too) and fine droplets.
 * Movement eases out; the fade runs on its own, so the mist lingers.
 */
function puff(layer) {
  const width = layer.clientWidth;
  const height = layer.clientHeight;
  const x = width * NOZZLE.x;
  const y = height * NOZZLE.y;
  const made = [];
  const add = (style, frames, timing) => {
    const el = document.createElement("span");
    el.setAttribute("data-mist", "");
    Object.assign(el.style, { position: "absolute", pointerEvents: "none", borderRadius: "9999px", opacity: "0", ...style });
    layer.appendChild(el);
    el.animate?.(frames, { fill: "forwards", easing: "linear", ...timing });
    made.push(el);
  };
  const fade = (peak, hold) => [{ offset: 0, opacity: 0 }, { offset: 0.1, opacity: peak }, { offset: hold, opacity: peak * 0.7 }, { offset: 1, opacity: 0 }];
  const move = (from, to) => [{ offset: 0, transform: from, easing: EASE_OUT }, { offset: 1, transform: to }];
  const frames = (from, to, peak, hold) => {
    const steps = fade(peak, hold);
    return [
      { ...steps[0], ...move(from, to)[0] },
      steps[1],
      steps[2],
      { ...steps[3], transform: to },
    ];
  };

  // The jet: a bright streak shooting out of the nozzle.
  const jetW = width * 0.42;
  const jetH = width * 0.09;
  add(
    { left: `${x}px`, top: `${y - jetH / 2}px`, width: `${jetW}px`, height: `${jetH}px`, transformOrigin: "0 50%", background: "radial-gradient(closest-side at 18% 50%, rgba(255,255,255,0.95), rgba(255,255,255,0.35) 55%, rgba(255,255,255,0))", filter: "blur(1.5px)" },
    frames("rotate(-14deg) scaleX(0.08) scaleY(0.6)", "rotate(-18deg) scaleX(1.25) scaleY(1.9)", 0.9, 0.3),
    { duration: 800 },
  );

  // Haze: blurs and brightens what is behind it, like a real cloud of perfume.
  for (let i = 0; i < 4; i += 1) {
    const size = width * random(0.3, 0.42);
    const angle = random(-26, -6) * RAD;
    const distance = width * random(0.14, 0.34);
    add(
      { left: `${x - size / 2}px`, top: `${y - size / 2}px`, width: `${size}px`, height: `${size}px`, backdropFilter: "blur(3px) brightness(1.12)", WebkitBackdropFilter: "blur(3px) brightness(1.12)", background: "radial-gradient(closest-side, rgba(255,255,255,0.28), rgba(255,255,255,0))", maskImage: "radial-gradient(closest-side, #000 35%, transparent)", WebkitMaskImage: "radial-gradient(closest-side, #000 35%, transparent)" },
      frames("translate(0, 0) scale(0.25)", `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance - random(4, 14)}px) scale(${random(1.4, 2)})`, 1, 0.55),
      { duration: random(1400, SPRAY_MS), delay: 60 + i * 50 },
    );
  }

  // Mist: soft white clouds that spread out.
  for (let i = 0; i < 9; i += 1) {
    const size = width * random(0.13, 0.24);
    const angle = random(-32, 0) * RAD;
    const distance = width * random(0.18, 0.52);
    add(
      { left: `${x - size / 2}px`, top: `${y - size / 2}px`, width: `${size}px`, height: `${size}px`, background: "radial-gradient(closest-side, rgba(255,255,255,0.8), rgba(255,255,255,0.3) 55%, rgba(255,255,255,0))", filter: "blur(2px)" },
      frames("translate(0, 0) scale(0.2)", `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance - random(2, 12)}px) scale(${random(1.6, 2.6)})`, random(0.6, 0.85), 0.5),
      { duration: random(1200, SPRAY_MS), delay: i * 30 },
    );
  }

  // Droplets: fine specks catching the light.
  for (let i = 0; i < 30; i += 1) {
    const size = random(1.5, 3.4);
    const angle = random(-40, 10) * RAD;
    const distance = width * random(0.25, 0.68);
    add(
      { left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px`, background: "rgba(255,255,255,0.95)", boxShadow: "0 0 4px rgba(255,255,255,0.85)" },
      frames("translate(0, 0)", `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance + random(6, 22)}px)`, 1, 0.55),
      { duration: random(800, 1300), delay: random(0, 160) },
    );
  }
  return () => made.forEach((el) => el.remove());
}

export default function PerfumeSprayRail({ items, onOpen, loading = false, className = "", ...rest }) {
  const hoverMode = usePrefers("(hover: hover) and (pointer: fine)");
  const reduced = usePrefers("(prefers-reduced-motion: reduce)");
  const scrollerRef = useRef(null);
  const cards = useRef([]);
  const layers = useRef([]);
  const photos = useRef([]);
  const busy = useRef([]);
  const middle = useRef(null);
  const settle = useRef(0);
  const [spraying, setSpraying] = useState(null);

  /* Spray card `index` once; ignored while it is still spraying. */
  const spray = useCallback((index) => {
    const layer = layers.current[index];
    if (!layer || busy.current[index] || reduced) return;
    busy.current[index] = true;
    setSpraying(index);
    const clean = puff(layer);
    // The bottle gives a tiny "press".
    photos.current[index]?.animate?.([{ transform: "scale(1)" }, { transform: "scale(1.012)", offset: 0.15 }, { transform: "scale(1)" }], { duration: 420, easing: "ease-out" });
    window.setTimeout(() => {
      clean();
      busy.current[index] = false;
      setSpraying((current) => (current === index ? null : current));
    }, SPRAY_MS + 250);
  }, [reduced]);

  /* Phones: the card that settles in the middle of the row sprays. */
  const sprayMiddle = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const centre = scroller.scrollLeft + scroller.clientWidth / 2;
    let best = null;
    let distance = Infinity;
    cards.current.forEach((card, index) => {
      if (!card) return;
      const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - centre);
      if (d < distance) { best = index; distance = d; }
    });
    if (best !== null && best !== middle.current) {
      middle.current = best;
      spray(best);
    }
  }, [spray]);

  const onScroll = () => {
    if (hoverMode) return;
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(sprayMiddle, 160);
  };

  useEffect(() => () => window.clearTimeout(settle.current), []);

  // Phones: the first bottle sprays once when the row comes into view.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (hoverMode || !scroller || !items.length || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      window.setTimeout(sprayMiddle, 350);
    }, { threshold: 0.6 });
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [hoverMode, items.length, sprayMiddle]);

  return (
    <div
      ref={scrollerRef}
      role="group"
      {...rest}
      data-slot="perfume-spray-rail"
      data-mode={hoverMode ? "hover" : "touch"}
      className={`scrollbar-hide -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:gap-6 sm:px-8 md:-mx-12 md:px-12 ${className}`}
      onScroll={onScroll}
    >
      {loading && !items.length && Array.from({ length: 5 }, (_, index) => (
        <div key={`placeholder-${index}`} aria-hidden="true" className="w-[68vw] max-w-[17rem] shrink-0 sm:w-[15rem] lg:w-auto lg:flex-1">
          <div className="aspect-[4/5] animate-pulse rounded-2xl bg-[var(--color-surface-muted)]" />
          <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-[var(--color-surface-muted)]" />
        </div>
      ))}
      {items.map((item, index) => (
        <article
          key={item.id}
          ref={(node) => { cards.current[index] = node; }}
          data-spraying={spraying === index ? "true" : "false"}
          className="w-[68vw] max-w-[17rem] shrink-0 snap-center sm:w-[15rem] lg:w-auto lg:max-w-none lg:flex-1 lg:shrink"
          onPointerEnter={(event) => { if (event.pointerType === "mouse") spray(index); }}
        >
          <SpaLink
            href={item.href}
            onNavigate={() => onOpen?.(item)}
            onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) spray(index); }}
            className="group block outline-none"
            aria-label={item.name}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[var(--color-surface-muted)] ring-[var(--color-text)] ring-offset-2 ring-offset-[var(--color-bg)] group-focus-visible:ring-2">
              <div ref={(node) => { photos.current[index] = node; }} className="absolute inset-0 origin-[50%_20%]">
                <SafeImage src={item.image} alt={item.alt || item.name} sizes="(min-width: 1024px) 19vw, (min-width: 640px) 240px, 68vw" maxWidth={960} className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]" />
              </div>
              <span ref={(node) => { layers.current[index] = node; }} data-spray-layer aria-hidden="true" className="pointer-events-none absolute inset-0" />
              {item.badge && (
                <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-[#11212D]/85 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#E9D3A4]">
                  {item.badge}
                </span>
              )}
            </div>
            <h3 className="mt-4 font-serif text-[1.35rem] leading-tight">{item.name}</h3>
            {item.description && <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[var(--color-muted)]">{item.description}</p>}
            {item.meta && <p className="mt-1.5 text-[13px] tabular-nums">{item.meta}</p>}
          </SpaLink>
        </article>
      ))}
    </div>
  );
}
