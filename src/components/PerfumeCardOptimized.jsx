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
  const { id, name, price, image, alt } = product;

  const href = `/product/${product.slug}`;

  return (
    <article className="group">
      {/* Real links so search engines can discover every product page. */}
      <SpaLink href={href} onNavigate={onClickCard} tabIndex={-1} aria-hidden="true" className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] bg-[var(--color-surface-muted)] shadow-[0_16px_42px_rgba(55,45,36,0.10)]">
          <SafeImage
            src={image}
            alt={alt || name}
            className="h-full w-full object-cover transition duration-[1100ms] ease-out group-hover:scale-[1.012]"
            priority={priority}
          />
        </div>
      </SpaLink>

      <div className="glass-card-meta relative z-10">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <h3 className="font-serif text-[1.65rem] font-normal leading-tight">
              <SpaLink href={href} onNavigate={onClickCard} className="hover:underline hover:underline-offset-4">{name}</SpaLink>
            </h3>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Eau de Parfum</p>
          </div>
          <div className="shrink-0 pt-1 text-sm">{formatINR(price)}</div>
        </div>

        {quantity > 0 ? (
          <div className="mt-4 grid h-10 grid-cols-[2.5rem_1fr_2.5rem] border-t border-[var(--color-border)]">
            <button
              onClick={() => onUpdateQty(id, quantity - 1)}
              className="text-lg transition-opacity hover:opacity-50"
              aria-label={"Decrease " + name}
            >
              −
            </button>
            <span className="flex items-center justify-center text-[9px] font-semibold uppercase tracking-[0.12em]">{quantity} in bag</span>
            <button
              onClick={() => onUpdateQty(id, quantity + 1)}
              className="text-lg transition-opacity hover:opacity-50"
              aria-label={"Increase " + name}
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={() => onAdd(product)}
            aria-label={"Add " + name + " to bag"}
            className="mt-4 flex h-10 w-full items-center justify-between border-t border-[var(--color-border)] text-[9px] font-semibold uppercase tracking-[0.15em] transition-opacity hover:opacity-50"
          >
            <span>Add to bag</span>
            <span aria-hidden="true">+</span>
          </button>
        )}
      </div>
    </article>
  );
});

PerfumeCardOptimized.displayName = "PerfumeCardOptimized";
export default PerfumeCardOptimized;
