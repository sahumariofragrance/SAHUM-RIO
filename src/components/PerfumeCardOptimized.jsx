import React from "react";
import { Minus, Plus } from "lucide-react";
import SafeImage from "./SafeImage";
import SpaLink from "./SpaLink";
import { formatINR } from "../utils/money";

// Tiles are two columns on phones, three from 1024px.
const TILE_SIZES = "(min-width: 1024px) 30vw, 48vw";
const roundButton = "flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-60";

/**
 * Product tile: the full product photo with no frame; it slowly zooms on
 * hover, or fades to the second gallery photo when there is one.
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
  const hoverImage = Array.isArray(product.gallery) && product.gallery.length > 1 ? product.gallery[1] : null;
  const href = `/product/${product.slug}`;

  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-surface-muted)]">
        {/* Real links so search engines can discover every product page. */}
        <SpaLink href={href} onNavigate={onClickCard} tabIndex={-1} aria-hidden="true" className="absolute inset-0 block">
          <SafeImage
            src={image}
            alt={alt || name}
            priority={priority}
            className="h-full w-full object-cover transition duration-[1400ms] ease-out group-hover:scale-[1.04]"
            sizes={TILE_SIZES}
          />
          {hoverImage && (
            <SafeImage
              src={hoverImage}
              alt=""
              sizes={TILE_SIZES}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 ease-out group-hover:opacity-100"
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
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm transition duration-300 hover:scale-110 hover:bg-[var(--color-kesar)] hover:text-[#FFF8EF] md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
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
