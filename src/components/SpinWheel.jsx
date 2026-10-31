import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Gift, Loader2, Sparkles, X } from "lucide-react";
import SafeImage from "./SafeImage";
import { noteList } from "../lib/scentQuiz";
import { testerImage } from "../lib/testers";
import { WHEEL, prizeLabel, prizeUseBy, spinOnServer, wheelPrizes } from "../lib/spinWheel";

const SEGMENT_DEG = 360 / WHEEL.segments.length;
const TURNS = 6;
const SPIN_MS = 4800;
const GOLD = "#9BA8AB";
const TESTERS = WHEEL.segments.find((segment) => segment.testers)?.testers || 0;

const sentence = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Tester slices sit side by side, so they alternate two shades of slate.
function segmentColours(segment, index) {
  if (segment.testers) return { fill: index % 2 ? "#4A5C6A" : "#3A4B58", text: "#F1F3F3" };
  if (segment.percent >= 10) return { fill: "#06141B", text: "#CCD0CF" };
  return { fill: "#CCD0CF", text: "#06141B" };
}

/** "x y" on a circle of `radius`, `deg` degrees clockwise from the top. */
function point(radius, deg) {
  const rad = (deg * Math.PI) / 180;
  return `${(radius * Math.sin(rad)).toFixed(2)} ${(-radius * Math.cos(rad)).toFixed(2)}`;
}

function Wheel({ rotation, durationMs, onStopped }) {
  return (
    <svg viewBox="-108 -114 216 222" className="mx-auto block w-full max-w-[17rem]" role="img" aria-label={`Prize wheel: ${wheelPrizes()}`}>
      <circle r="104" fill={GOLD} />
      <g
        style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "0 0", transition: durationMs ? `transform ${durationMs}ms cubic-bezier(0.15, 0.85, 0.12, 1)` : "none" }}
        onTransitionEnd={onStopped}
      >
        {WHEEL.segments.map((segment, index) => {
          const colours = segmentColours(segment, index);
          const from = index * SEGMENT_DEG;
          return (
            <g key={index}>
              <path d={`M0 0L${point(98, from)}A98 98 0 0 1 ${point(98, from + SEGMENT_DEG)}Z`} fill={colours.fill} stroke={GOLD} strokeWidth="0.8" />
              <g transform={`rotate(${from + SEGMENT_DEG / 2})`} fill={colours.text} textAnchor="middle">
                <text y="-67" className="font-serif" fontSize={segment.testers ? 13 : 18} fontWeight="700">
                  {segment.testers ? `${segment.testers === 1 ? "" : `${segment.testers} `}FREE` : `${segment.percent}%`}
                </text>
                <text y="-55" fontSize="5.8" fontWeight="700" letterSpacing="1">{segment.testers ? (segment.testers === 1 ? "TESTER" : "TESTERS") : "OFF"}</text>
              </g>
            </g>
          );
        })}
        {Array.from({ length: WHEEL.segments.length * 2 }, (_, index) => {
          const [x, y] = point(101, index * (SEGMENT_DEG / 2)).split(" ");
          return <circle key={index} cx={x} cy={y} r="1.7" fill="#E6EAEA" />;
        })}
      </g>
      <circle r="17" fill="#06141B" stroke={GOLD} strokeWidth="2.5" />
      <text y="2.2" fill="#CCD0CF" fontSize="6" fontWeight="700" letterSpacing="1.2" textAnchor="middle">SPIN</text>
      <path d="M0 -83L-9.5 -109H9.5Z" fill="#253745" stroke="#E6EAEA" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/** The 10 ml tester bottle with this perfume's name (public/products/testers/), or its bottle photo if there is none yet. */
function TesterPhoto({ product, small = false }) {
  const [failed, setFailed] = useState(false);
  const size = small ? "h-10 w-8" : "h-16 w-[3.2rem]";
  if (failed) return <SafeImage src={product.image} alt="" sizes="52px" maxWidth={320} className={`${size} shrink-0 rounded-lg object-cover`} />;
  return <img src={testerImage(product)} alt="" loading="lazy" onError={() => setFailed(true)} className={`${size} shrink-0 rounded-lg object-cover`} />;
}

/** One perfume to choose as the free tester; `featured` rows are our suggestions. */
function TesterRow({ product, chosen, disabled, featured, showImages, onToggle }) {
  const id = Number(product.id);
  const notes = noteList(product).slice(0, 3).join(", ");
  const look = featured
    ? chosen
      ? "border-[var(--color-kesar)] ring-2 ring-[var(--color-kesar)]"
      : "border-[var(--color-kesar)] hover:ring-1 hover:ring-[var(--color-kesar)]"
    : chosen
      ? "border-[var(--color-kesar)] ring-1 ring-[var(--color-kesar)]"
      : "border-[var(--color-border)] hover:border-[var(--color-text)]";
  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-pressed={chosen}
        disabled={disabled}
        className={`flex w-full items-center gap-3 rounded-xl border bg-[var(--color-surface)] text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${featured ? "px-3 py-2.5" : "px-3 py-1.5"} ${look}`}
      >
        {showImages && <TesterPhoto product={product} small={!featured} />}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{product.name}</span>
            {featured && <span className="shrink-0 rounded-full bg-[var(--color-kesar)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--color-bg)]">Recommended</span>}
          </span>
          <span className="block truncate text-xs text-[var(--color-muted)]">{[product.fragrance_family, notes].filter(Boolean).join(" · ")}</span>
        </span>
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${chosen ? "border-[var(--color-kesar)] bg-[var(--color-kesar)] text-white" : "border-[var(--color-border)]"}`} aria-hidden="true">
          {chosen && <Check className="h-3.5 w-3.5" />}
        </span>
      </button>
    </li>
  );
}

/**
 * Choose free testers; `picks` are product ids. Our suggestions (`options`,
 * each a different family to the bag) come first and stand out; any other
 * perfume on sale (`others`) is one tap away. With one tester to choose,
 * tapping another perfume switches to it.
 */
export function TesterPicker({ options, others = [], picks, count, onToggle, showImages = true }) {
  const full = count > 1 && picks.length >= count;
  const pickedOther = others.some((product) => picks.includes(Number(product.id)));
  const [showOthers, setShowOthers] = useState(pickedOther);
  useEffect(() => { if (pickedOther) setShowOthers(true); }, [pickedOther]);
  const row = (product, featured) => {
    const chosen = picks.includes(Number(product.id));
    return <TesterRow key={product.id} product={product} chosen={chosen} disabled={!chosen && full} featured={featured} showImages={showImages} onToggle={onToggle} />;
  };
  return (
    <div>
      {options.length > 0 && <>
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-kesar)]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />Our picks for you: something new to try
        </p>
        <ul className="space-y-2">{options.map((product) => row(product, true))}</ul>
      </>}
      {others.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowOthers((open) => !open)}
            aria-expanded={showOthers}
            className="flex w-full items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-[var(--color-muted)] underline-offset-4 hover:text-[var(--color-text)] hover:underline"
          >
            {showOthers ? "Hide other perfumes" : `Or choose another perfume (${others.length})`}
            <ChevronDown className={`h-3.5 w-3.5 transition ${showOthers ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {showOthers && <ul className="mt-2 max-h-72 space-y-1.5 overflow-y-auto pr-1">{others.map((product) => row(product, false))}</ul>}
        </div>
      )}
    </div>
  );
}

/**
 * The wheel shown once before checkout. The server picks the prize; the wheel
 * turns to it. `onWon(spin)` runs when it stops (or when the sheet is closed
 * mid-spin). A testers prize is chosen from `testerOptions` here or later in
 * the order summary.
 */
export default function SpinWheel({ onClose, onWon, testerOptions = [], testerOthers = [], picks = [], onTogglePick, demo = false }) {
  const [phase, setPhase] = useState("ready"); // ready | spinning | won | error
  const [spin, setSpin] = useState(null);
  // At rest the pointer sits in the middle of the first segment.
  const [rotation, setRotation] = useState(-SEGMENT_DEG / 2);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState("");
  const reported = useRef(false);
  const settled = useRef(false);
  const spinRef = useRef(null);
  const stopTimer = useRef(null);
  const revealTimer = useRef(null);

  function report() {
    if (spinRef.current && !reported.current) {
      reported.current = true;
      onWon(spinRef.current);
    }
  }

  function stopped() {
    if (settled.current || !spinRef.current) return;
    settled.current = true;
    clearTimeout(stopTimer.current);
    // A moment on the winning segment, then the prize.
    revealTimer.current = setTimeout(() => { setPhase("won"); report(); }, 900);
  }

  // `putOff`: closed without a prize, so don't open again by itself this visit.
  function close() {
    if (phase === "spinning" && !spinRef.current) return; // still waiting for the server
    report();
    onClose(!spinRef.current);
  }

  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      clearTimeout(stopTimer.current);
      clearTimeout(revealTimer.current);
    };
  }, []);

  async function start() {
    setPhase("spinning");
    setError("");
    try {
      const won = await spinOnServer(demo);
      spinRef.current = won;
      setSpin(won);
      const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const duration = calm ? 600 : SPIN_MS;
      // Land somewhere inside the prize's segment, not always on its middle.
      const jitter = (Math.random() - 0.5) * (SEGMENT_DEG - 12);
      setDurationMs(duration);
      setRotation((calm ? 1 : TURNS) * 360 + 360 - (won.segment * SEGMENT_DEG + SEGMENT_DEG / 2) + jitter);
      // In case the browser skips the end-of-turn event (e.g. a background tab).
      stopTimer.current = setTimeout(stopped, duration + 400);
    } catch (spinError) {
      // Switched off in Admin since the page loaded: go straight on to checkout.
      if (spinError.closed) { onClose(true); return; }
      setError(spinError.message);
      setPhase("error");
    }
  }

  const won = phase === "won" && spin;
  const testersReady = won && spin.testers ? picks.length === spin.testers : true;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Spin the wheel">
      <div className="absolute inset-0 bg-black/45" onClick={close} aria-hidden="true" />
      <div className="quiz-sheet-in relative flex max-h-[100dvh] w-full flex-col overflow-y-auto bg-[var(--color-bg)] px-5 pb-6 pt-4 sm:max-h-[92vh] sm:max-w-md sm:rounded-3xl sm:px-7 sm:pb-7">
        <div className="flex items-center justify-between pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]">Before checkout</p>
          <button type="button" onClick={close} disabled={phase === "spinning" && !spin} className="-mr-2 rounded-full p-2 transition hover:bg-[var(--color-surface-muted)] disabled:opacity-30" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center">
          <h2 className="font-serif text-3xl font-semibold">{won ? "You won!" : "A small gesture of thanks"}</h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-[var(--color-muted)]">{won ? sentence(prizeLabel(spin)) : `Spin once for ${wheelPrizes()}.`}</p>
        </div>

        {!won && (
          <div className="mt-5">
            <Wheel rotation={rotation} durationMs={durationMs} onStopped={stopped} />
          </div>
        )}

        <div aria-live="polite">
          {won && spin.demo && (
            <p className="mt-4 rounded-xl bg-[var(--color-surface-muted)] px-3 py-2 text-center text-xs text-[var(--color-muted)]">Preview link only: a demo prize. It shows in the order summary but can’t be used to pay. The real wheel starts once its database update has run.</p>
          )}
          {won && spin.percent && (
            <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-kesar)] bg-[var(--color-surface)] px-5 py-4 text-center">
              <p className="font-serif text-5xl leading-none text-[var(--color-kesar)]">{spin.percent}%</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">off your order</p>
              <p className="mt-3 text-sm">Code <span className="font-mono font-semibold tracking-wider">{spin.code}</span> is applied at checkout.</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">Use it by {prizeUseBy(spin)}. Doesn’t combine with other offers: you get the bigger saving.</p>
            </div>
          )}
          {won && spin.testers && (
            <div className="mt-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <Gift className="h-4 w-4 shrink-0 text-[var(--color-kesar)]" aria-hidden="true" />
                {spin.testers === 1 ? "Choose your free tester" : `Choose your ${spin.testers} free testers`}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">Packed free with your order. Use it by {prizeUseBy(spin)}.</p>
              <div className="mt-3">
                <TesterPicker options={testerOptions} others={testerOthers} picks={picks} count={spin.testers} onToggle={onTogglePick} />
              </div>
            </div>
          )}
          {phase === "error" && <p className="mt-4 text-center text-sm text-red-600" role="alert">{error}</p>}
        </div>

        <div className="mt-6 space-y-2">
          {won ? (
            <>
              <button type="button" onClick={close} disabled={!testersReady} className="w-full rounded-full bg-[var(--color-text)] px-5 py-3 font-semibold text-[var(--color-bg)] transition hover:opacity-90 disabled:opacity-40">
                {testersReady ? "Continue to checkout" : spin.testers === 1 ? "Choose your tester" : `Choose ${spin.testers - picks.length} more`}
              </button>
              {!testersReady && <button type="button" onClick={close} className="w-full py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]">Choose {spin.testers === 1 ? "it" : "them"} at checkout</button>}
            </>
          ) : (
            <>
              <button type="button" onClick={start} disabled={phase === "spinning"} className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-text)] px-5 py-3 font-semibold text-[var(--color-bg)] transition hover:opacity-90 disabled:opacity-60">
                {phase === "spinning" ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Spinning…</> : phase === "error" ? "Try again" : "Spin the wheel"}
              </button>
              <button type="button" onClick={close} disabled={phase === "spinning"} className="w-full py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-40">
                {phase === "error" ? "Continue to checkout" : "Maybe later"}
              </button>
            </>
          )}
        </div>

        <p className="mt-3 text-center text-[11px] leading-4 text-[var(--color-muted)]">
          One prize per customer, checked by email and phone number. Valid on one order for {WHEEL.validDays} days.
          {TESTERS > 0 && ` ${TESTERS === 1 ? "The free tester comes" : "Free testers come"} with a perfume bottle.`}
        </p>
      </div>
    </div>
  );
}
