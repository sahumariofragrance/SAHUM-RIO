"use client";

import Link from "next/link";
import SafeImage from "../src/components/SafeImage";
import { useCart } from "./cart";
import { formatINR } from "../src/utils/money";

export default function ProductCard({ product, priority = false }) {
  const { items, addToCart, updateQty } = useCart();
  const quantity = items.find(item => item.product_id === product.id)?.qty || 0;

  return (
    <article className="group">
      <Link href={`/product/${product.slug}`} className="block" aria-label={`View details for ${product.name}`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] bg-[var(--color-surface-muted)] shadow-[0_16px_42px_rgba(55,45,36,0.10)]">
          <SafeImage src={product.image} alt={product.alt || product.name} priority={priority} className="h-full w-full object-cover transition duration-[1100ms] ease-out group-hover:scale-[1.012]" />
        </div>
      </Link>
      <div className="glass-card-meta relative z-10">
        <Link href={`/product/${product.slug}`} className="block">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0"><h2 className="font-serif text-[1.65rem] font-normal leading-tight">{product.name}</h2><p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Eau de Parfum</p></div>
            <div className="shrink-0 pt-1 text-sm">{formatINR(product.price)}</div>
          </div>
        </Link>
        {quantity > 0 ? (
          <div className="mt-4 grid h-10 grid-cols-[2.5rem_1fr_2.5rem] border-t border-[var(--color-border)]">
            <button onClick={() => updateQty(product.id, quantity - 1)} className="text-lg">−</button>
            <span className="flex items-center justify-center text-[9px] font-semibold uppercase tracking-[0.12em]">{quantity} in bag</span>
            <button onClick={() => updateQty(product.id, quantity + 1)} className="text-lg">+</button>
          </div>
        ) : (
          <button onClick={() => addToCart(product)} className="mt-4 flex h-10 w-full items-center justify-between border-t border-[var(--color-border)] text-[9px] font-semibold uppercase tracking-[0.15em]"><span>Add to bag</span><span>+</span></button>
        )}
      </div>
    </article>
  );
}
