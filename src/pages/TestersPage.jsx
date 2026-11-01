import React, { useCallback, useMemo, useState } from "react";
import AudienceFilter from "../components/AudienceFilter";
import TesterSetCard from "../components/testers/TesterSetCard";
import TesterCard from "../components/testers/TesterCard";
import TesterProgress from "../components/testers/TesterProgress";
import { useCart } from "../context/cartContext";
import { useProducts } from "../context/ProductsContext";
import { TESTER } from "../lib/catalogue";
import { SET_SAVING, testerSetsForSale, testersForSale } from "../lib/testerShop";
import { formatINR } from "../utils/money";

/** sahumario.com/jhalak: Jhalak (10 ml testers), one by one or in sets of five. */
export default function TestersPage({ setCurrentPage, onProductNavigate }) {
  const { products, loading } = useProducts();
  const { items, addToCart, updateQty } = useCart();
  const [audience, setAudience] = useState("all");
  const testers = useMemo(() => testersForSale(products), [products]);
  const sets = useMemo(() => testerSetsForSale(products), [products]);
  const shown = useMemo(() => testers.filter((tester) => audience === "all" || tester.audience === audience), [testers, audience]);
  const qtyOf = useCallback((id) => items.find((item) => item.product_id === id)?.qty || 0, [items]);
  const addSet = useCallback((set) => set.testers.forEach((tester) => addToCart(tester)), [addToCart]);

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-32 sm:px-8 md:px-12">
      <header className="relative isolate mx-auto max-w-3xl pb-12 pt-14 text-center md:pt-20">
        <div className="motif-jaali" aria-hidden="true" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">Jhalak · झलक · {TESTER.ml} ml</p>
        <h1 className="mt-5 font-serif text-[clamp(2.4rem,5vw,4rem)] font-normal leading-[1.05] tracking-[-0.02em]">Not sure yet?<br />Begin with a few drops.</h1>
        <div className="motif-patola mx-auto mt-6 w-36 opacity-70" aria-hidden="true" />
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-[var(--color-muted)]">
          Jhalak means a glimpse. Every SAHUMäRIO perfume in a {TESTER.ml} ml spray: wear it for a few days, let it settle on your skin, then choose the bottle that feels like you.
        </p>
        <div className="mx-auto mt-8 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm">
          <span><strong className="font-semibold">{formatINR(TESTER.price)}</strong> <span className="text-[var(--color-muted)]">each</span></span>
          <span className="hidden h-4 w-px bg-[var(--color-border)] sm:block" aria-hidden="true" />
          <span><strong className="font-semibold">Any {TESTER.bundleSize} for {formatINR(TESTER.bundlePrice)}</strong> <span className="text-[var(--color-muted)]">· save {formatINR(SET_SAVING)}</span></span>
        </div>
        <p className="mt-3 text-xs text-[var(--color-muted)]">The set price is applied automatically in your bag, for our sets and for your own mix.</p>
        {TESTER.setReward && <p className="mx-auto mt-4 max-w-md text-sm leading-6"><span className="font-semibold">A thank-you with every set:</span> we email you a personal code for {TESTER.setReward.percent}% off your 50 ml bottle.</p>}
      </header>

      {sets.length > 0 && (
        <section aria-labelledby="tester-sets-title" className="pt-4">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-kesar)]">Jhalak sets</p>
            <h2 id="tester-sets-title" className="mt-3 font-serif text-4xl font-normal">Five glimpses, chosen for you</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((set) => <TesterSetCard key={set.id} set={set} onAdd={addSet} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="tester-own-title" className="pt-20 md:pt-28">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-kesar)]">Your own five</p>
          <h2 id="tester-own-title" className="mt-3 font-serif text-4xl font-normal">Or make your own five</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--color-muted)]">
            Pick any {TESTER.bundleSize} Jhalak and they cost {formatINR(TESTER.bundlePrice)} together. Add more, and every {TESTER.bundleSize} are {formatINR(TESTER.bundlePrice)} again.
          </p>
        </div>
        <AudienceFilter products={testers} value={audience} onChange={setAudience} className="mt-8 sm:justify-center" />
        {loading && !testers.length ? (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-[var(--color-surface-muted)]" />)}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((tester) => (
              <TesterCard key={tester.id} tester={tester} qty={qtyOf(tester.id)} onAdd={addToCart} onQty={updateQty} onOpenPerfume={onProductNavigate} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto mt-20 max-w-3xl border-t border-[var(--color-border)] pt-10 md:mt-28">
        <h2 className="text-center font-serif text-2xl font-normal">How Jhalak works</h2>
        <dl className="mt-8 grid gap-6 text-sm leading-6 sm:grid-cols-3">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em]">{TESTER.ml} ml Eau de Parfum</dt>
            <dd className="mt-2 text-[var(--color-muted)]">The same Eau de Parfum as the bottle, enough to wear it for days, at home and out.</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em]">Any {TESTER.bundleSize} for {formatINR(TESTER.bundlePrice)}</dt>
            <dd className="mt-2 text-[var(--color-muted)]">{formatINR(TESTER.price)} each, or {formatINR(TESTER.bundlePrice)} for every {TESTER.bundleSize}. The price changes by itself in your bag.{TESTER.setReward && ` Every set also earns a ${TESTER.setReward.percent}% code for your 50 ml bottle, sent by email (one use, ${TESTER.setReward.validDays} days).`}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em]">Free delivery</dt>
            <dd className="mt-2 text-[var(--color-muted)]">Delivered free across India, on their own or with your bottles.</dd>
          </div>
        </dl>
      </section>

      <TesterProgress items={items} onViewBag={() => setCurrentPage?.("cart")} />
    </div>
  );
}
