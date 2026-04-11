import React from "react";
import { RouterLink } from "../router";

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-sm font-semibold tracking-wide text-amber-600">404</p>
      <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-[var(--color-muted)]">
        The page you are looking for does not exist or may have been moved.
      </p>
      <RouterLink
        to="/"
        className="mt-8 inline-block rounded-lg bg-amber-600 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-700"
      >
        Go to Home
      </RouterLink>
    </section>
  );
}
