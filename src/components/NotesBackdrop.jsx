import React, { useMemo } from "react";
import NoteIcon from "./NoteIcon";

const COLUMNS = 6;
const ROWS = 8;

// Same layout every visit for the same perfume (seeded by its slug).
function seededRandom(text) {
  let seed = 0;
  for (let i = 0; i < text.length; i += 1) seed = (Math.imul(seed, 31) + text.charCodeAt(i)) | 0;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The perfume's notes as a faint printed pattern behind the top of its page
 * (lemons, apples, waves…), slowly floating over a soft wash of their colours
 * and fading out further down. Purely decorative. Place inside a
 * `relative isolate` box.
 */
export default function NotesBackdrop({ notes, seed }) {
  const shapes = useMemo(() => {
    if (!notes.length) return [];
    const random = seededRandom(seed || "notes");
    const list = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let column = 0; column < COLUMNS; column += 1) {
        const index = row * COLUMNS + column;
        const note = notes[index % notes.length];
        list.push({
          key: index,
          note,
          // Every other row is shifted half a column, like a printed pattern.
          left: ((column + (row % 2 ? 0.5 : 0) + random() * 0.35) / COLUMNS) * 100,
          top: ((row + random() * 0.4) / ROWS) * 100,
          size: 30 + Math.round(random() * 24),
          rotate: Math.round(random() * 60 - 30),
          duration: 9 + Math.round(random() * 7),
          delay: -Math.round(random() * 10),
          // Phones are narrower: they show four of the six columns.
          phone: column % 3 !== 1,
        });
      }
    }
    return list;
  }, [notes, seed]);

  if (!shapes.length) return null;
  const [first, second = first] = notes;
  const wash = [
    `radial-gradient(55% 40% at 8% 6%, color-mix(in srgb, ${first.color} 16%, transparent), transparent 70%)`,
    `radial-gradient(50% 40% at 96% 52%, color-mix(in srgb, ${second.color} 13%, transparent), transparent 70%)`,
  ].join(", ");

  return (
    <div
      aria-hidden="true"
      className="notes-backdrop pointer-events-none absolute -top-8 bottom-0 -left-5 -right-5 -z-10 overflow-hidden sm:-left-8 sm:-right-8 md:-left-12 md:-right-12 md:-top-12"
      style={{ backgroundImage: wash }}
    >
      {shapes.map(({ key, note, left, top, size, rotate, duration, delay, phone }) => (
        <span
          key={key}
          className={`notes-float absolute ${phone ? "" : "hidden sm:block"}`}
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${size}px`,
            color: note.color,
            "--rot": `${rotate}deg`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
          }}
        >
          <NoteIcon icon={note.icon} className="h-auto w-full" strokeWidth={0.9} />
        </span>
      ))}
    </div>
  );
}
