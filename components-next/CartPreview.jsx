"use client";

import Link from "next/link";
import { useCart } from "./cart";
import { formatINR } from "../src/utils/money";

export default function CartPreview() {
  const { items, updateQty, subtotal } = useCart();

  return (
    <section className="mx-auto max-w-4xl px-5 py-14 sm:px-8 md:py-20">
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">Migration preview</p>
      <h1 className="mt-4 font-serif text-5xl font-normal tracking-[-0.03em]">Your bag</h1>

      <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6">
        Checkout and Razorpay are intentionally disabled in this Next.js preview. Production payments remain untouched.
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[var(--color-muted)]">Your bag is empty.</p>
          <Link href="/perfumes" className="mt-5 inline-block border-b border-[var(--color-text)] pb-1 text-[10px] font-semibold uppercase tracking-[0.16em]">Explore perfumes</Link>
        </div>
      ) : (
        <>
          <div className="mt-10 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {items.map(item => (
              <div key={item.product_id} className="grid gap-4 py-6 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
                <img src={item.image} alt={item.alt || item.name} className="aspect-[4/5] w-20 object-cover" />
                <div>
                  <Link href={`/product/${item.slug}`} className="font-serif text-2xl">{item.name}</Link>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{formatINR(item.price)}</p>
                </div>
                <div className="grid h-10 grid-cols-[2.5rem_3rem_2.5rem] border border-[var(--color-border)]">
                  <button onClick={() => updateQty(item.product_id, item.qty - 1)}>−</button>
                  <span className="flex items-center justify-center text-sm">{item.qty}</span>
                  <button onClick={() => updateQty(item.product_id, item.qty + 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between text-lg"><span>Subtotal</span><strong>{formatINR(subtotal)}</strong></div>
          <p className="mt-3 text-xs text-[var(--color-muted)]">No payment can be started from this preview.</p>
        </>
      )}
    </section>
  );
}
