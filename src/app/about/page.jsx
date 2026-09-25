export const metadata = {
  title: "About SAHUMäRIO® | Independent Fragrance Brand",
  description: "Learn about SAHUMäRIO®, an independent fragrance brand creating a focused Eau de Parfum collection.",
  alternates: { canonical: "/about" },
};

function Founder({ initials, name, role, children }) {
  return (
    <div className="glass-soft rounded-2xl p-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700">{initials}</div>
        <h3 className="mt-3 text-lg font-medium">{name}</h3>
        <p className="text-sm text-[var(--color-muted)]">{role}</p>
        <p className="mt-2 text-sm text-[var(--color-text)]">{children}</p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8 md:py-20">
      <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">About SAHUMäRIO®</h1>
      <p className="mt-5 leading-relaxed text-[var(--color-text)]">SAHUMäRIO is an independent fragrance brand creating a focused collection of Eau de Parfum fragrances. Each fragrance is given its own name, character, and visual identity.</p>
      <p className="mt-3 leading-relaxed text-[var(--color-text)]">We are still growing, and we believe clear information matters. Product details are added only when they have been confirmed, so customers can choose without unsupported claims.</p>
      <h2 className="mt-10 text-xl font-semibold">Our Founders</h2>
      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Founder initials="HM" name="Harsh Maradiya" role="Co-Founder">Focused on developing the fragrances and growing the collection in India.</Founder>
        <Founder initials="NM" name="Neel Maradiya" role="Co-Founder">Focused on the brand, digital storefront, and customer experience.</Founder>
      </div>
    </section>
  );
}
