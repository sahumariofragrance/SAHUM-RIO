import React, { useMemo } from "react";
import { characterOf, parseNotes } from "../lib/scentNotes";

// Fine-line illustrations, one per kind of note (24×24, drawn in currentColor).
const ICONS = {
  lemon: (
    <>
      <path d="M4.5 12c0-4 3.4-7 7.5-7s7.5 3 7.5 7-3.4 7-7.5 7-7.5-3-7.5-7Z" />
      <path d="M3 12h1.5M19.5 12H21" />
      <path d="M8 10.5c.8-1.6 2.3-2.5 4-2.5" opacity=".55" />
    </>
  ),
  wheel: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="5.6" opacity=".55" />
      <path d="M12 6.4v11.2M6.4 12h11.2M8 8l8 8M16 8l-8 8" opacity=".55" />
    </>
  ),
  orange: (
    <>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 6.5V4.5" />
      <path d="M12 5.5c1.2-1.6 3.2-2 4.8-1.4-.6 1.6-2.4 2.6-4.8 2.4" />
      <path d="M8.5 12.5h.01M11 15.5h.01M14.5 12h.01M15.5 16h.01" strokeWidth="1.8" opacity=".55" />
    </>
  ),
  apple: (
    <>
      <path d="M12 8.2c-1.4-1.3-4.5-1.6-6 .6-1.8 2.6-.6 7.4 1.7 9.6 1.4 1.3 2.6.9 4.3.4 1.7.5 2.9.9 4.3-.4 2.3-2.2 3.5-7 1.7-9.6-1.5-2.2-4.6-1.9-6-.6Z" />
      <path d="M12 8.2c0-1.6.3-3 1.2-4.2" />
      <path d="M13.2 5.3c1.3-1.1 2.9-1.2 4-.6-.9 1.3-2.5 1.7-4 .6Z" />
    </>
  ),
  pineapple: (
    <>
      <path d="M12 9c3.3 0 5 2.6 5 6s-1.7 6-5 6-5-2.6-5-6 1.7-6 5-6Z" />
      <path d="M8.2 12.5l6.6 6.2M9.2 18.8l6.4-6M7.6 15.8l3.3-3.2M13 20.5l3-2.8" opacity=".55" />
      <path d="M12 9V5M12 8.5 9.2 4.2M12 8.5l2.8-4.3M12 8.6 8 6.3M12 8.6l4-2.3" />
    </>
  ),
  peach: (
    <>
      <path d="M12 7.2c4.4-1.6 8 1.4 7.6 6-.4 4.2-3.6 6.8-7.6 6.8s-7.2-2.6-7.6-6.8c-.4-4.6 3.2-7.6 7.6-6Z" />
      <path d="M12 7.2c-1 3-1 8 0 12.6" opacity=".55" />
      <path d="M12 7c.6-1.8 2.2-3 4.2-3.2-.3 1.8-1.8 3.1-4.2 3.2Z" />
    </>
  ),
  melon: (
    <>
      <path d="M3.5 10h17a8.5 8.5 0 0 1-17 0Z" />
      <path d="M5.8 10a6.2 6.2 0 0 0 12.4 0" opacity=".55" />
      <path d="M9 12.6h.01M12 14.2h.01M15 12.6h.01" strokeWidth="1.8" />
    </>
  ),
  wave: (
    <>
      <path d="M3 9c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" />
      <path d="M3 13c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" opacity=".75" />
      <path d="M3 17c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" opacity=".5" />
    </>
  ),
  air: (
    <>
      <path d="M3 9h11a2.5 2.5 0 1 0-2.5-2.5" />
      <path d="M3 13h15a2.5 2.5 0 1 1-2.5 2.5" />
      <path d="M3 17h7" opacity=".55" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19C5 10.5 10.5 5 19 5c0 8.5-5.5 14-14 14Z" />
      <path d="M5 19 14 10M9.5 14.5h3.5M12 12V9" opacity=".55" />
    </>
  ),
  spice: (
    <>
      <path d="M12 3.5 13.6 10l6.4 2-6.4 2L12 20.5 10.4 14 4 12l6.4-2Z" />
      <circle cx="12" cy="12" r="1.3" opacity=".55" />
    </>
  ),
  musk: (
    <>
      <path d="M7 17.5a4.5 4.5 0 0 1-.6-9 5.5 5.5 0 0 1 10.7 1.2A3.9 3.9 0 0 1 17 17.5Z" />
      <path d="M9 14.5c1.8 1 4.2 1 6 0" opacity=".55" />
    </>
  ),
  flower: (
    <>
      <path d="M12 9.5c-1.6-2.6-1.6-4.6 0-6 1.6 1.4 1.6 3.4 0 6ZM12 14.5c1.6 2.6 1.6 4.6 0 6-1.6-1.4-1.6-3.4 0-6ZM9.5 12c-2.6 1.6-4.6 1.6-6 0 1.4-1.6 3.4-1.6 6 0ZM14.5 12c2.6-1.6 4.6-1.6 6 0-1.4 1.6-3.4 1.6-6 0Z" />
      <circle cx="12" cy="12" r="1.6" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 4c.7 4.2 1.8 5.3 6 6-4.2.7-5.3 1.8-6 6-.7-4.2-1.8-5.3-6-6 4.2-.7 5.3-1.8 6-6Z" />
      <path d="M18 15.5c.3 1.4.7 1.8 2 2-1.3.3-1.7.7-2 2-.3-1.3-.7-1.7-2-2 1.3-.2 1.7-.6 2-2Z" opacity=".55" />
    </>
  ),
  drop: (
    <path d="M12 4c3 3.6 5.5 6.6 5.5 9.8a5.5 5.5 0 0 1-11 0C6.5 10.6 9 7.6 12 4Z" />
  ),
};

function NoteIcon({ icon }) {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[icon] || ICONS.drop}
    </svg>
  );
}

/**
 * "The notes" on a perfume page: each note with its own illustration, colour
 * and a few words, and the perfume's character worked out from those notes.
 */
export default function ScentNotes({ product }) {
  const notes = useMemo(() => parseNotes(product?.notes), [product?.notes]);
  const character = useMemo(() => characterOf(notes), [notes]);
  if (!notes.length) return null;

  return (
    <section aria-labelledby="scent-notes-title" className="mt-10 border-t border-[var(--color-border)] pt-6">
      <h2 id="scent-notes-title" className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">The notes</h2>
      <ul className="mt-5 grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4">
        {notes.map((note) => (
          <li key={note.key} className="flex flex-col items-center text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ color: note.color, backgroundColor: `color-mix(in srgb, ${note.color} 14%, transparent)` }}
            >
              <NoteIcon icon={note.icon} />
            </span>
            <span className="mt-2.5 text-[13px] font-medium leading-tight">{note.label}</span>
            {note.words && <span className="mt-0.5 text-[11px] leading-tight text-[var(--color-muted)]">{note.words}</span>}
          </li>
        ))}
      </ul>

      {character.length > 0 && (
        <div className="mt-8">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Character</p>
          <dl className="mt-3 space-y-2.5">
            {character.map(({ accord, label, level }) => (
              <div key={accord} className="grid grid-cols-[4.5rem_1fr] items-center gap-3">
                <dt className="text-xs">{label}</dt>
                <dd className="flex gap-1" aria-label={`${label}: ${level} out of 5`}>
                  {[1, 2, 3, 4, 5].map((step) => (
                    <span key={step} className={`h-1.5 flex-1 rounded-full ${step <= level ? "bg-[var(--color-kesar)]" : "bg-[var(--color-border)]"}`} />
                  ))}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[11px] text-[var(--color-muted)]">Worked out from its notes.</p>
        </div>
      )}
    </section>
  );
}
