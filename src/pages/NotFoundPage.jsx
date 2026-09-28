import React from "react";

export default function NotFoundPage({ navigate }) {
  return (
    <section className="mx-auto max-w-4xl px-5 py-24 text-center">
      <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--color-muted)]">404</p>
      <h1 className="mt-4 font-serif text-5xl font-normal">Page not found</h1>
      <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[var(--color-muted)]">
        This page does not exist. Explore the SAHUMäRIO® Eau de Parfum collection instead.
      </p>
      <a
        href="/perfumes"
        onClick={(event) => { event.preventDefault(); navigate("perfumes"); }}
        className="mt-8 inline-block border-b border-[var(--color-text)] pb-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
      >
        Shop all perfumes
      </a>
    </section>
  );
}
