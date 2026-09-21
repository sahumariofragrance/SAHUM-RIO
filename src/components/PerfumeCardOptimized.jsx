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
  const { id, name, description, price, image, alt } = product;

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
          className="h-full w-full object-cover transition duration-[900ms] ease-out group-hover:scale-[1.018]"
          priority={priority}
        />
      </div>

      <div className="pt-4">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Eau de Parfum</p>
            <h3 className="mt-2 font-serif text-2xl font-normal leading-tight">{name}</h3>
          </div>
          <div className="shrink-0 pt-5 text-sm">{formatINR(price)}</div>
        </div>

        <p className="mt-2 line-clamp-2 max-w-md text-xs leading-5 text-[var(--color-muted)]">{description}</p>

        {quantity > 0 ? (
          <div className="mt-5 grid h-11 grid-cols-[2.75rem_1fr_2.75rem] border border-[var(--color-border)]">
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateQty(id, quantity - 1); }}
              className="border-r border-[var(--color-border)] text-lg transition hover:bg-[var(--color-surface)]"
              aria-label={"Decrease " + name}
            >
              −
            </button>
            <span className="flex items-center justify-center text-[10px] font-semibold uppercase tracking-[0.12em]">{quantity} in bag</span>
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateQty(id, quantity + 1); }}
              className="border-l border-[var(--color-border)] text-lg transition hover:bg-[var(--color-surface)]"
              aria-label={"Increase " + name}
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(product); }}
            className="mt-5 flex h-11 w-full items-center justify-between border-t border-[var(--color-text)] text-[10px] font-semibold uppercase tracking-[0.16em] transition-opacity hover:opacity-55"
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
