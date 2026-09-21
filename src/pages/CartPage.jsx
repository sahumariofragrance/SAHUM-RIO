import React, { useMemo } from "react";
import { MailCheck, Minus, Plus, ShieldCheck, Trash2, Truck } from "lucide-react";
import SafeImage from "../components/SafeImage";
import { useCart } from "../context/cartContext";
import { useProducts } from "../context/ProductsContext";
import { formatINR } from "../utils/money";

export default function CartPage({ setCurrentPage }) {
  const { items, updateQty, removeItem, subtotal } = useCart();
  const { products } = useProducts();

  const catalogueById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const detailedItems = useMemo(() => items.map((item) => {
    const product = catalogueById.get(item.product_id);
    return {
      ...item,
      image: item.image || product?.image || product?.image_url || "",
      alt: item.alt || product?.alt || `${item.name} Eau de Parfum bottle`,
    };
  }), [items, catalogueById]);

  if (!items.length) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="font-serif text-4xl font-semibold">Your Cart</h1>
        <p className="mt-4 text-[var(--color-muted)]">Your cart is empty.</p>
        <button onClick={() => setCurrentPage("perfumes")} className="mt-8 rounded-full bg-[#24160f] px-6 py-3 font-medium text-white hover:bg-amber-800">Explore Perfumes</button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <div className="border-b border-[var(--color-border)] pb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-700">Your selection</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight md:text-5xl">Your Cart</h1>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {detailedItems.map((item) => (
            <article key={item.product_id} className="grid grid-cols-[5rem_1fr] gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-[6rem_1fr_auto] sm:items-center sm:gap-5">
              <div className="aspect-[4/5] overflow-hidden rounded-xl bg-[var(--color-surface-muted)]">
                <SafeImage src={item.image} alt={item.alt} className="h-full w-full object-cover" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700">Eau de Parfum</p>
                <h2 className="mt-1 truncate font-serif text-xl font-semibold">{item.name}</h2>
                <p className="mt-2 text-sm text-[var(--color-muted)]">{formatINR(item.price)} each</p>
              </div>

              <div className="col-span-2 flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-4 sm:col-span-1 sm:border-0 sm:pt-0">
                <div className="flex items-center overflow-hidden rounded-full border border-[var(--color-border)]">
                  <button onClick={() => updateQty(item.product_id, item.qty - 1)} className="p-2.5 hover:bg-[var(--color-surface-muted)]" aria-label={`Decrease ${item.name}`}><Minus className="h-4 w-4" /></button>
                  <span className="min-w-9 text-center text-sm font-medium">{item.qty}</span>
                  <button onClick={() => updateQty(item.product_id, item.qty + 1)} className="p-2.5 hover:bg-[var(--color-surface-muted)]" aria-label={`Increase ${item.name}`}><Plus className="h-4 w-4" /></button>
                </div>
                <strong className="min-w-20 text-right">{formatINR(item.price * item.qty)}</strong>
                <button onClick={() => removeItem(item.product_id)} className="p-2 text-red-600 hover:text-red-700" aria-label={`Remove ${item.name}`}><Trash2 className="h-5 w-5" /></button>
              </div>
            </article>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 lg:sticky lg:top-24">
          <h2 className="font-serif text-2xl font-semibold">Order Summary</h2>
          <div className="mt-5 flex justify-between border-b border-[var(--color-border)] pb-4">
            <span className="text-[var(--color-muted)]">Subtotal</span>
            <strong>{formatINR(subtotal)}</strong>
          </div>
          <div className="mt-4 flex justify-between text-lg">
            <span className="font-semibold">Total</span>
            <strong>{formatINR(subtotal)}</strong>
          </div>

          <div className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-5 text-sm text-[var(--color-muted)]">
            <div className="flex items-center gap-2"><Truck className="h-4 w-4 shrink-0 text-amber-700" /><span>Free shipping across India</span></div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-amber-700" /><span>Secure Razorpay payment</span></div>
            <div className="flex items-center gap-2"><MailCheck className="h-4 w-4 shrink-0 text-amber-700" /><span>Order updates by email</span></div>
          </div>

          <button onClick={() => setCurrentPage("checkout")} className="mt-6 w-full rounded-full bg-[#24160f] px-5 py-3 font-semibold text-white hover:bg-amber-800">Proceed to Checkout</button>
          <button onClick={() => setCurrentPage("perfumes")} className="mt-3 w-full px-5 py-2.5 text-sm font-medium text-[var(--color-muted)] hover:text-amber-700">Continue Shopping</button>
        </aside>
      </div>
    </section>
  );
}
