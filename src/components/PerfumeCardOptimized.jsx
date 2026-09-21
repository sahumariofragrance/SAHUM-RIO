import React from "react";
import { ShoppingBag } from "lucide-react";
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
      className="group overflow-hidden bg-[var(--color-bg)]"
      onClick={onClickCard}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClickCard();
        }
      }}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[var(--color-surface-muted)]">
        <SafeImage
          src={image}
          alt={alt || name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
          priority={priority}
        />
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-800 backdrop-blur">
          Eau de Parfum
        </div>
      </div>

      <div className="px-1 pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-lg font-semibold leading-tight">{name}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-muted)]">{description}</p>
          </div>
          <div className="shrink-0 text-sm font-semibold">{formatINR(price)}</div>
        </div>

        {quantity > 0 ? (
          <div className="mt-4 flex h-11 items-center justify-between rounded-full border border-[var(--color-text)] px-2">
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateQty(id, quantity - 1); }}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-surface)]"
              aria-label={`Decrease ${name}`}
            >
              −
            </button>
            <span className="text-sm font-semibold">{quantity} in cart</span>
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateQty(id, quantity + 1); }}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-surface)]"
              aria-label={`Increase ${name}`}
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(product); }}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#24160f] text-sm font-semibold text-white transition hover:bg-amber-800"
          >
            <ShoppingBag className="h-4 w-4" />
            Add to cart
          </button>
        )}
      </div>
    </article>
  );
});

PerfumeCardOptimized.displayName = "PerfumeCardOptimized";
export default PerfumeCardOptimized;
