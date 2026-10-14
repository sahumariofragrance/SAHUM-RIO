import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Instagram, RotateCcw, X } from "lucide-react";
import SafeImage from "./SafeImage";
import { useCart } from "../context/cartContext";
import { useProducts } from "../context/ProductsContext";
import { COMBO, comboActive } from "../lib/offers";
import { QUESTIONS, noteList, rankPerfumes } from "../lib/scentQuiz";
import { shareScentCard } from "../lib/scentCard";
import { bottlesOnly, isSampleSet } from "../lib/samples";
import { formatINR } from "../utils/money";

const PICK_DELAY_MS = 220;

function Progress({ step }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {QUESTIONS.map((question, index) => (
        <span key={question.id} className={`h-1 rounded-full transition-all duration-300 ${index <= step ? "w-6 bg-[var(--color-text)]" : "w-3 bg-[var(--color-border)]"}`} />
      ))}
    </div>
  );
}

function Question({ question, index, picked, onPick, onBack }) {
  return (
    <div className="quiz-step-in flex flex-1 flex-col">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Question {index + 1} of {QUESTIONS.length}</p>
      <h2 className="mt-3 font-serif text-[2.1rem] font-normal leading-[1.05] tracking-[-0.01em]">{question.title}</h2>
      <div className="mt-7 grid grid-cols-2 gap-3">
        {question.options.map((option) => {
          const selected = picked === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onPick(option.id)}
              aria-pressed={selected}
              className={`flex min-h-[8.5rem] flex-col items-start justify-between rounded-2xl border p-4 text-left transition duration-200 ${selected ? "border-[var(--color-text)] bg-[var(--color-surface-muted)] scale-[0.98]" : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text)]"}`}
            >
              <span className="text-[2rem] leading-none" aria-hidden="true">{option.emoji}</span>
              <span>
                <span className="block text-[15px] font-medium leading-5">{option.label}</span>
                <span className="mt-1 block text-xs text-[var(--color-muted)]">{option.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
      {index > 0 && (
        <button type="button" onClick={onBack} className="mt-6 inline-flex items-center gap-2 self-start text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)] transition hover:text-[var(--color-text)]">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back
        </button>
      )}
    </div>
  );
}

function Result({ match, pair, sampleSet, perfumeCount, onViewProduct, onViewSampleSet, onGoToBag, onRetake }) {
  const { items, addToCart } = useCart();
  const [sharing, setSharing] = useState("");
  const inBag = (product) => items.some((item) => item.product_id === product.id);
  const notes = noteList(match);
  const profile = String(match.scent_profile || match.description || "").split(/[.;]/)[0].trim();
  const showPair = pair && comboActive();

  async function share() {
    setSharing("working");
    const outcome = await shareScentCard(match).catch(() => "failed");
    setSharing(outcome === "downloaded" ? "downloaded" : "");
  }

  return (
    <div className="quiz-step-in flex flex-1 flex-col">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-kesar)]">Your scent is</p>
      <h2 className="mt-2 text-center font-serif text-[2.9rem] font-normal leading-none tracking-[-0.02em]">{match.name}</h2>
      {profile && <p className="mx-auto mt-3 max-w-[18rem] text-center font-serif text-lg italic leading-6 text-[var(--color-muted)]">{profile}</p>}

      <div className="quiz-glow relative mx-auto mt-6 w-[52%] max-w-[12rem]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[var(--color-surface-muted)]">
          <SafeImage src={match.image} alt={match.alt || match.name} sizes="200px" maxWidth={480} className="absolute inset-0 h-full w-full object-cover" />
        </div>
      </div>

      {notes.length > 0 && (
        <ul className="mt-5 flex flex-wrap justify-center gap-1.5" aria-label="Notes">
          {notes.map((note) => (
            <li key={note} className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[11px] text-[var(--color-muted)]">{note}</li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid gap-2.5">
        {inBag(match) ? (
          <button type="button" onClick={onGoToBag} className="flex h-12 w-full items-center justify-center gap-2 border border-[var(--color-text)] text-[10px] font-semibold uppercase tracking-[0.16em] transition hover:bg-[var(--color-text)] hover:text-[var(--color-bg)]">
            <Check className="h-4 w-4" aria-hidden="true" /> In your bag · View bag
          </button>
        ) : (
          <button type="button" onClick={() => addToCart(match)} className="flex h-12 w-full items-center justify-between bg-[var(--color-text)] px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bg)] transition-opacity hover:opacity-85">
            <span>Add to bag</span><span>{formatINR(match.price)}</span>
          </button>
        )}
        <button type="button" onClick={onViewProduct} className="h-10 text-[10px] font-semibold uppercase tracking-[0.16em] underline-offset-4 hover:underline">
          See {match.name} in detail
        </button>
        {sampleSet && (
          <p className="text-center text-xs text-[var(--color-muted)]">
            Can't decide?{" "}
            <button type="button" onClick={onViewSampleSet} className="font-semibold text-[var(--color-text)] underline underline-offset-4 hover:opacity-75">
              Try all {perfumeCount} in the {sampleSet.name} for {formatINR(sampleSet.price)}
            </button>
          </p>
        )}
      </div>

      {showPair && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--color-surface-muted)]">
            <SafeImage src={pair.image} alt="" sizes="48px" maxWidth={320} className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-5">Layer it with {pair.name}</p>
            <p className="text-xs leading-5 text-[var(--color-muted)]">Any 2 for {formatINR(COMBO.pairPrice)} · {COMBO.short || COMBO.label}</p>
          </div>
          {inBag(match) && inBag(pair) ? (
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-kesar)]">Added</span>
          ) : (
            <button
              type="button"
              onClick={() => { if (!inBag(match)) addToCart(match); if (!inBag(pair)) addToCart(pair); }}
              className="shrink-0 rounded-full bg-[var(--color-kesar)] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:opacity-90"
            >
              Add both
            </button>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-5">
        <button type="button" onClick={share} disabled={sharing === "working"} className="inline-flex items-center gap-2 rounded-full border border-[var(--color-text)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition hover:bg-[var(--color-text)] hover:text-[var(--color-bg)] disabled:opacity-60">
          <Instagram className="h-4 w-4" aria-hidden="true" />
          {sharing === "working" ? "Making…" : sharing === "downloaded" ? "Saved to phone" : "Share my scent"}
        </button>
        <button type="button" onClick={onRetake} className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] transition hover:text-[var(--color-text)]">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Retake
        </button>
      </div>
    </div>
  );
}

/** "Find your scent": three taps, then the perfume that matches them best. */
export default function ScentQuiz({ open, onClose, onProductNavigate, onGoToBag }) {
  const { products } = useProducts();
  const [answers, setAnswers] = useState([]);
  const [picked, setPicked] = useState(null);
  const timer = useRef(null);
  const step = answers.length;
  const done = step >= QUESTIONS.length;

  const perfumes = useMemo(() => bottlesOnly(products), [products]);
  const sampleSet = useMemo(() => products.find(isSampleSet) || null, [products]);
  const perfumeCount = perfumes.length;
  const [match, pair] = useMemo(() => (done ? rankPerfumes(perfumes, answers) : []), [done, perfumes, answers]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!open) return null;

  function pick(id) {
    setPicked(id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setAnswers((current) => [...current, id]);
      setPicked(null);
    }, PICK_DELAY_MS);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Find your scent">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} aria-hidden="true" />
      <div className="quiz-sheet-in relative flex h-[100dvh] w-full flex-col overflow-y-auto bg-[var(--color-bg)] px-5 pb-6 pt-4 sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-3xl sm:px-7 sm:pb-7">
        <div className="flex items-center justify-between pb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]">Find your scent</p>
          {!done && <Progress step={step} />}
          <button type="button" onClick={onClose} className="-mr-2 rounded-full p-2 transition hover:bg-[var(--color-surface-muted)]" aria-label="Close quiz">
            <X className="h-5 w-5" />
          </button>
        </div>
        {done && match ? (
          <Result
            key="result"
            match={match}
            pair={pair}
            sampleSet={sampleSet}
            perfumeCount={perfumeCount}
            // Leaving for another page closes the quiz with the homepage.
            onViewProduct={() => onProductNavigate?.(match)}
            onViewSampleSet={() => onProductNavigate?.(sampleSet)}
            onGoToBag={() => onGoToBag?.()}
            onRetake={() => setAnswers([])}
          />
        ) : (
          <Question
            key={step}
            question={QUESTIONS[Math.min(step, QUESTIONS.length - 1)]}
            index={step}
            picked={picked}
            onPick={pick}
            onBack={() => setAnswers((current) => current.slice(0, -1))}
          />
        )}
      </div>
    </div>
  );
}

/** Homepage invitation to the quiz. */
export function QuizInvite({ onStart }) {
  return (
    <div className="promo-ticket-in mx-auto mt-8 w-full max-w-md">
      <button
        type="button"
        onClick={onStart}
        className="group flex w-full items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-left transition hover:border-[var(--color-text)] sm:px-6"
      >
        <span className="quiz-fruits shrink-0 text-[1.35rem] leading-none" aria-hidden="true">
          <span>🍋</span><span>🍏</span><span>🍍</span><span>💧</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Not sure which one?</span>
          <span className="mt-1 block font-serif text-xl leading-6">Find your scent in 3 taps</span>
        </span>
        <span className="shrink-0 rounded-full bg-[var(--color-text)] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-bg)] transition group-hover:opacity-85">
          Start
        </span>
      </button>
    </div>
  );
}
