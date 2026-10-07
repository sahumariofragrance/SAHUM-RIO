import React, { useMemo } from "react";

// Real fruit photos (cut out, in public/notes/), one per kind of note.
// Notes without a photo here are simply left out.
const PHOTOS = {
  lemon: "/notes/lemon.webp",
  lime: "/notes/lime.webp",
  orange: "/notes/orange.webp",
  citrus: "/notes/orange.webp",
  apple: "/notes/apple.webp",
  pineapple: "/notes/pineapple.webp",
  peach: "/notes/peach.webp",
  melon: "/notes/melon.webp",
  aqua: "/notes/water.webp",
  fresh: "/notes/water.webp",
  ozone: "/notes/water.webp",
  herbal: "/notes/herbs.webp",
  spice: "/notes/spice.webp",
};

// Where the fruits sit around the perfume photo: the first peeks out from
// behind its top-right corner, the second sits in front of its bottom-left
// corner, the third (desktop only) floats softly out of focus further out.
const SLOTS = [
  "-right-4 -top-8 w-[34%] sm:-right-10 sm:-top-12 lg:w-[30%] -z-[1]",
  "-bottom-8 -left-4 w-[36%] sm:-left-10 sm:-bottom-10 lg:w-[28%] z-10",
  "notes-fruit-far hidden lg:block -left-14 top-[38%] w-[16%] -z-[1]",
];

/**
 * Real fruits from the perfume's notes, placed around its photo like a styled
 * product shoot, floating gently. Decorative only. Place inside the relatively
 * positioned box that holds the photo.
 */
export default function NotesFruits({ notes }) {
  const photos = useMemo(() => {
    const seen = new Set();
    return notes
      .map((note) => PHOTOS[note.key])
      .filter((src) => src && !seen.has(src) && seen.add(src))
      .slice(0, SLOTS.length);
  }, [notes]);

  if (!photos.length) return null;
  return photos.map((src, index) => (
    <img
      key={src}
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className={`notes-fruit pointer-events-none absolute h-auto select-none ${SLOTS[index]}`}
      style={{ animationDelay: `${-index * 3}s` }}
    />
  ));
}
