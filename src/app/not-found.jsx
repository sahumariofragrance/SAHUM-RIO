import Link from "next/link";

export default function NotFound() {
  return <section className="mx-auto max-w-4xl px-5 py-24 text-center"><p className="text-[9px] uppercase tracking-[0.2em] text-[var(--color-muted)]">404</p><h1 className="mt-4 font-serif text-5xl font-normal">Page not found</h1><Link href="/perfumes" className="mt-8 inline-block border-b border-[var(--color-text)] pb-1 text-[10px] font-semibold uppercase tracking-[0.16em]">Back to collection</Link></section>;
}
