import React from "react";
import SafeImage from "./SafeImage";
import SpaLink from "./SpaLink";
import { formatINR } from "../utils/money";

const PerfumeCardOptimized = React.memo(({
  product,
  quantity = 0,
  onClickCard,
  onAdd,
  onUpdateQty,
  priority = false,
}) => {
  const { id, name, price, image, alt, size_volume: size } = product;
  const hoverImage = Array.isArray(product.gallery) && product.gallery.length > 1 ? product.gallery[1] : null;

  const href = `/product/${product.slug}`;

  return (
    <article className="group">
      {/* Real links so search engines can discover every product page. */}
      <SpaLink href={href} onNavigate={onClickCard} tabIndex={-1} aria-hidden="true" className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-surface-muted)]">
          <SafeImage
            src={image}
            alt={alt || name}
            className="h-full w-full object-cover transition duration-[1400ms] ease-out group-hover:scale-[1.035]"
            priority={priority}
          />
          {hoverImage && (
            <img
              src={hoverImage}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 ease-out group-hover:opacity-100"
            />
          )}
        </div>
      </SpaLink>

      <div className="pt-5">
        <div className="flex items-baseline justify-between gap-5">
          <h3 className="min-w-0 font-serif text-[1.7rem] font-normal leading-tight tracking-[-0.01em]">
            <SpaLink href={href} onNavigate={onClickCard} className="bg-[length:0%_1px] bg-left-bottom bg-no-repeat bg-gradient-to-r from-current to-current transition-[background-size] duration-500 hover:bg-[length:100%_1px]">
              {name}
            </SpaLink>
          </h3>
          <div className="shrink-0 text-sm tabular-nums">{formatINR(price)}</div>
        </div>
        <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Eau de Parfum{size ? ` · ${size}` : ""}
        </p>

        {quantity > 0 ? (
          <div className="mt-5 grid h-10 grid-cols-[2.5rem_1fr_2.5rem] border-y border-[var(--color-border)]">
            <button onClick={() => onUpdateQty(id, quantity - 1)} className="text-lg transition-opacity hover:opacity-50" aria-label={"Decrease " + name}>−</button>
            <span className="flex items-center justify-center text-[9px] font-semibold uppercase tracking-[0.16em]">{quantity} in bag</span>
            <button onClick={() => onUpdateQty(id, quantity + 1)} className="text-lg transition-opacity hover:opacity-50" aria-label={"Increase " + name}>+</button>
          </div>
        ) : (
          <button
            onClick={() => onAdd(product)}
            aria-label={"Add " + name + " to bag"}
            className="mt-5 flex h-10 w-full items-center justify-between border-y border-[var(--color-border)] text-[9px] font-semibold uppercase tracking-[0.2em] transition-colors hover:border-[var(--color-text)]"
          >
            <span>Add to bag</span>
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:rotate-90">+</span>
          </button>
        )}
      </div>
    </article>
  );
});

PerfumeCardOptimized.displayName = "PerfumeCardOptimized";
export default PerfumeCardOptimized;
