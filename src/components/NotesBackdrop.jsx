import React from "react";

/**
 * A soft wash of the perfume's first two note colours behind the top of its
 * page. Decorative only. Place inside a `relative isolate` box.
 */
export default function NotesBackdrop({ notes }) {
  if (!notes.length) return null;
  const [first, second = first] = notes;
  const wash = [
    `radial-gradient(55% 40% at 8% 6%, color-mix(in srgb, ${first.color} 16%, transparent), transparent 70%)`,
    `radial-gradient(50% 40% at 96% 52%, color-mix(in srgb, ${second.color} 13%, transparent), transparent 70%)`,
  ].join(", ");
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-8 bottom-0 -left-5 -right-5 -z-10 sm:-left-8 sm:-right-8 md:-left-12 md:-right-12 md:-top-12"
      style={{ backgroundImage: wash }}
    />
  );
}
