import React from "react";
import { Minus, Plus } from "lucide-react";
import SafeImage from "./SafeImage";
import SpaLink from "./SpaLink";
import { formatINR } from "../utils/money";
import { bottleCutout } from "../data/bottleCutouts";

const roundButton = "flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-60";

/**
 * Product tile: the bottle alone on a soft, even backdrop. On hover it steps
 * into its own world: the full product photo fades in and settles.
 */
const PerfumeCardOptimized = React.memo(({
  product,
  quantity = 0,
  onClickCard,
  onAdd,
  onUpdateQty,
  priority = false,
}) => {
  const { id, name, price, image, alt } = product;
  const cutout = bottleCutout(product.slug);
  const href = `/product/${product.slug}`;

  return (
    <article className="group">
      <div className="product-tile relative aspect-[4/5] overflow-hidden">
        {/* Real links so search engines can discover every product page. */}
        <SpaLink href={href} onNavigate={onClickCard} tabIndex={-1} aria-hidden="true" className="absolute inset-0 block">
          {cutout ? (
            <>
              <span className="absolute bottom-[13%] left-1/2 h-4 w-[46%] -translate-x-1/2 rounded-[50%] bg-black/30 blur-md transition-opacity duration-700 group-hover:opacity-0" aria-hidden="true" />
              <img
                src={cutout}
                alt={alt || name}
                width="480"
                height="860"
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                className="absolute bottom-[15%] left-1/2 h-[64%] w-auto max-w-none -translate-x-1/2 transition duration-700 ease-out group-hover:scale-95 group-hover:opacity-0"
              />
              <img
                src={image}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full scale-[1.08] object-cover opacity-0 transition duration-[1200ms] ease-out group-hover:scale-100 group-hover:opacity-100"
              />
            </>
          ) : (
            <SafeImage
              src={image}
              alt={alt || name}
              priority={priority}
              className="h-full w-full object-cover transition duration-[1400ms] ease-out group-hover:scale-[1.035]"
            />
          )}
        </SpaLink>

        <div className="absolute bottom-3 right-3 z-10">
          {quantity > 0 ? (
            <div className="flex items-center rounded-full bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm">
              <button onClick={() => onUpdateQty(id, quantity - 1)} className={roundButton} aria-label={"Decrease " + name}><Minus className="h-3.5 w-3.5" /></button>
              <span className="min-w-[1.25rem] text-center text-xs tabular-nums" aria-label={`${quantity} in bag`}>{quantity}</span>
              <button onClick={() => onUpdateQty(id, quantity + 1)} className={roundButton} aria-label={"Increase " + name}><Plus className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <button
              onClick={() => onAdd(product)}
              aria-label={"Add " + name + " to bag"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm transition duration-300 hover:scale-110 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="pt-4">
        <h3 className="font-serif text-[1.2rem] font-normal leading-snug">
          <SpaLink href={href} onNavigate={onClickCard} className="bg-[length:0%_1px] bg-left-bottom bg-no-repeat bg-gradient-to-r from-current to-current transition-[background-size] duration-500 hover:bg-[length:100%_1px]">
            {name}
          </SpaLink>
        </h3>
        <p className="mt-1 text-[13px] tabular-nums text-[var(--color-muted)]">{formatINR(price)}</p>
      </div>
    </article>
  );
});

PerfumeCardOptimized.displayName = "PerfumeCardOptimized";
export default PerfumeCardOptimized;
