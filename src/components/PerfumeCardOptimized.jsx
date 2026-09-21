import React from "react";
import SafeImage from "./SafeImage";
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

  return (
    <article
      className="group cursor-pointer"
      onClick={onClickCard}
      role="button"
      tabIndex={0}
      aria-label={"View details for " + name}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClickCard();
        }
      }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-surface-muted)]">
        <SafeImage
          src={image}
          alt={alt || name}
          className="h-full w-full object-cover transition duration-[1100ms] ease-out group-hover:scale-[1.012]"
          priority={priority}
        />
      </div>

      <div className="pt-4">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <h3 className="font-serif text-[1.65rem] font-normal leading-tight">{name}</h3>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Eau de Parfum</p>
          </div>
          <div className="shrink-0 pt-1 text-sm">{formatINR(price)}</div>
        </div>

        {quantity > 0 ? (
          <div className="mt-4 grid h-10 grid-cols-[2.5rem_1fr_2.5rem] border-t border-[var(--color-border)]">
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateQty(id, quantity - 1); }}
              className="text-lg transition-opacity hover:opacity-50"
              aria-label={"Decrease " + name}
            >
              −
            </button>
            <span className="flex items-center justify-center text-[9px] font-semibold uppercase tracking-[0.12em]">{quantity} in bag</span>
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateQty(id, quantity + 1); }}
              className="text-lg transition-opacity hover:opacity-50"
              aria-label={"Increase " + name}
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(product); }}
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
