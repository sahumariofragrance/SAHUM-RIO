import React from 'react';
import { Card } from '../components/ui';

const FounderCard = React.memo(({ initials, name, role, description }) => (
  <Card>
    <div className="flex flex-col items-center text-center">
      <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg">
        {initials}
      </div>
      <h3 className="mt-3 text-lg font-medium">{name}</h3>
      <p className="text-sm text-[var(--color-muted)]">{role}</p>
      <p className="mt-2 text-[var(--color-text)] text-sm">{description}</p>
    </div>
  </Card>
));

FounderCard.displayName = 'FounderCard';

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">About SAHUMäRIO®</h1>
      
      <p className="mt-3 text-[var(--color-text)] leading-relaxed">
        SAHUMäRIO is an independent fragrance brand creating a focused collection of
        Eau de Parfum fragrances. Each fragrance is given its own name, character, and visual identity.
      </p>
      <p className="mt-2 text-[var(--color-text)] leading-relaxed">
        We are still growing, and we believe clear information matters. Product details are
        added only when they have been confirmed, so customers can choose without unsupported claims.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Our Founders</h2>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FounderCard
          initials="HM"
          name="Harsh Maradiya"
          role="Co-Founder"
          description="Focused on developing the fragrances and growing the collection in India."
        />
        <FounderCard
          initials="NM"
          name="Neel Maradiya"
          role="Co-Founder"
          description="Focused on the brand, digital storefront, and customer experience."
        />
      </div>
    </section>
  );
}
