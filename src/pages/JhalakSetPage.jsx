import React, { useCallback, useMemo } from "react";
import { ArrowDown, Check, Droplet, Gift, ShieldCheck, Truck } from "lucide-react";
import SpaLink from "../components/SpaLink";
import TesterSetCard from "../components/testers/TesterSetCard";
import TesterProgress from "../components/testers/TesterProgress";
import SetBottles from "../components/testers/SetBottles";
import { useCart } from "../context/cartContext";
import { useProducts } from "../context/ProductsContext";
import { TESTER } from "../lib/catalogue";
import { SET_SAVING, testerSetsForSale } from "../lib/testerShop";
import { formatINR } from "../utils/money";

/**
 * sahumario.com/jhalak-set: the landing page for Jhalak set ads. One set up
 * front with one button (the one in ?set=, e.g. ?set=for-her, otherwise The
 * Introduction), then the other sets, how it works and common questions.
 */
export default function JhalakSetPage({ setCurrentPage }) {
  const { products, loading } = useProducts();
  const { items, addToCart } = useCart();
  const sets = useMemo(() => testerSetsForSale(products), [products]);
  const wanted = useMemo(() => {
    try { return new URLSearchParams(window.location.search).get("set") || ""; } catch { return ""; }
  }, []);
  const hero = sets.find((set) => set.id === wanted) || sets[0] || null;
  const others = sets.filter((set) => set !== hero);
  const addSet = useCallback((set) => set.testers.forEach((tester) => addToCart(tester)), [addToCart]);
  // "Buy now" goes to checkout; it adds the set unless all five are already
  // in the bag (e.g. after coming back from checkout), so it's never added twice.
  const buyNow = useCallback((set) => {
    const inBag = set.testers.every((tester) => items.some((item) => item.product_id === tester.id));
    if (!inBag) addSet(set);
    setCurrentPage?.("checkout");
  }, [items, addSet, setCurrentPage]);
  const full = TESTER.price * TESTER.bundleSize;
  const reward = TESTER.setReward;

  const perks = [
    [Truck, "Free delivery across India"],
    reward && [Gift, `${reward.percent}% off your 50 ml bottle afterwards, by email`],
    [Droplet, "The same Eau de Parfum as the bottle"],
    [ShieldCheck, "Secure payment by Razorpay"],
  ].filter(Boolean);

  const faqs = [
    ["Is it the same perfume as the 50 ml bottle?", "Yes. Each Jhalak is the same Eau de Parfum as the bottle, in a 10 ml spray."],
    ["How long does a 10 ml Jhalak last?", "Long enough to wear each perfume for several days, at home and out, and see how it lives on your skin."],
    ["Can I choose my own five?", <>Yes. Any {TESTER.bundleSize} Jhalak cost {formatINR(TESTER.bundlePrice)} together. <SpaLink href="/jhalak" onNavigate={() => setCurrentPage?.("testers")} className="font-semibold underline underline-offset-4">Make your own five</SpaLink>.</>],
    ["When will it arrive?", "Usually in 3–7 business days, delivered free anywhere in India."],
    reward && ["How do I get the discount on a bottle?", `Right after your order we email you a personal code: ${reward.percent}% off 50 ml perfumes, one use, valid ${reward.validDays} days.`],
  ].filter(Boolean);

  if (!hero) {
    return (
      <section className="mx-auto max-w-[1100px] px-5 py-16 sm:px-8">
        {loading ? <div className="aspect-[3/2] animate-pulse rounded-2xl bg-[var(--color-surface-muted)]" /> : (
          <p className="text-center text-sm text-[var(--color-muted)]">Jhalak sets are being restocked. <SpaLink href="/jhalak" onNavigate={() => setCurrentPage?.("testers")} className="underline">See all Jhalak</SpaLink>.</p>
        )}
      </section>
    );
  }

  return (
    <div className="pb-28">
      <section className="mx-auto grid max-w-[1100px] items-center gap-8 px-5 pb-12 pt-8 sm:px-8 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:pt-14">
        <div className="order-1 md:order-2">
          {hero.photo
            ? <img src={hero.photo} alt={`${hero.name}: ${hero.testers.map((tester) => tester.shortName).join(", ")} Jhalak`} className="aspect-[3/2] w-full rounded-2xl object-cover" />
            : <SetBottles testers={hero.testers} className="aspect-[3/2] rounded-2xl" />}
        </div>
        <div className="order-2 md:order-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-kesar)]">Jhalak set · {TESTER.bundleSize} × {TESTER.ml} ml</p>
          <h1 className="mt-4 font-serif text-[clamp(2.3rem,6vw,3.6rem)] font-normal leading-[1.02] tracking-[-0.02em]">Five perfumes.<br />One small price.</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-[var(--color-muted)]">
            Not sure which SAHUMäRIO is yours? Try five in {TESTER.ml} ml sprays, wear each for a few days, then choose your bottle.
          </p>
          <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="font-serif text-2xl leading-tight">{hero.name}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase leading-5 tracking-[0.14em]">{hero.testers.map((tester) => tester.shortName).join(" · ")}</p>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
              <span className="font-serif text-3xl">{formatINR(TESTER.bundlePrice)}</span>
              <span className="text-sm text-[var(--color-muted)] line-through">{formatINR(full)}</span>
              <span className="text-xs font-semibold text-green-600">Save {formatINR(SET_SAVING)}</span>
            </p>
            <button
              type="button"
              onClick={() => buyNow(hero)}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[var(--color-text)] text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bg)] transition-opacity hover:opacity-85"
            >
              Buy now · {formatINR(TESTER.bundlePrice)}
            </button>
            <button type="button" onClick={() => document.getElementById("jhalak-sets")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-[var(--color-muted)] underline-offset-4 hover:text-[var(--color-text)] hover:underline">
              Or choose another set <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <ul className="mt-5 grid gap-2.5 text-sm">
            {perks.map(([Icon, text]) => (
              <li key={text} className="flex items-start gap-2.5"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-kesar)]" aria-hidden="true" /><span>{text}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <section id="jhalak-sets" aria-labelledby="jhalak-sets-title" className="mx-auto max-w-[1100px] scroll-mt-24 px-5 pt-8 sm:px-8">
        <h2 id="jhalak-sets-title" className="text-center font-serif text-3xl font-normal sm:text-4xl">Choose your five</h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm leading-6 text-[var(--color-muted)]">Every set is {TESTER.bundleSize} Jhalak for {formatINR(TESTER.bundlePrice)}.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((set) => <TesterSetCard key={set.id} set={set} onAdd={addSet} compact />)}
        </div>
      </section>

      <section aria-labelledby="jhalak-how-title" className="mx-auto max-w-[1100px] px-5 pt-16 sm:px-8 md:pt-20">
        <h2 id="jhalak-how-title" className="text-center font-serif text-3xl font-normal">How it works</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Choose a set", `Five perfumes, ${TESTER.ml} ml each, for ${formatINR(TESTER.bundlePrice)}. Delivered free.`],
            ["Wear them for a few days", "Spray one each day. See which one people notice and which one you miss."],
            ["Get your bottle", reward ? `Use the ${reward.percent}% code we email you on the 50 ml bottle you love.` : "Order the 50 ml bottle you love."],
          ].map(([title, text], index) => (
            <li key={title} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-text)] text-sm font-semibold text-[var(--color-bg)]">{index + 1}</span>
              <p className="mt-4 font-serif text-xl">{title}</p>
              <p className="mt-1.5 text-sm leading-6 text-[var(--color-muted)]">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="jhalak-faq-title" className="mx-auto max-w-[760px] px-5 pt-16 sm:px-8 md:pt-20">
        <h2 id="jhalak-faq-title" className="text-center font-serif text-3xl font-normal">Questions</h2>
        <div className="mt-6 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                {question}<span className="text-lg text-[var(--color-muted)] transition group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{answer}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center">
          <button type="button" onClick={() => buyNow(hero)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-text)] px-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bg)] hover:opacity-85">
            <Check className="h-4 w-4" aria-hidden="true" />Buy {hero.name} · {formatINR(TESTER.bundlePrice)}
          </button>
        </div>
      </section>

      <TesterProgress items={items} onViewBag={() => setCurrentPage?.("checkout")} actionLabel="Checkout" />
    </div>
  );
}
