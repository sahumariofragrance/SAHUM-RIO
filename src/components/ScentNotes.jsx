import React, { useMemo } from "react";
import { characterOf, parseNotes } from "../lib/scentNotes";
import NoteIcon from "./NoteIcon";

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
