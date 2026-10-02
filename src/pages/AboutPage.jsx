import React from 'react';
import SectionHeader from '../components/SectionHeader';
import { Card } from '../components/ui';

const FounderCard = React.memo(({ initials, photo, name, role, description }) => (
  <Card>
    <div className="flex flex-col items-center text-center">
      {photo ? (
        <img
          src={photo}
          alt={name}
          width="96"
          height="96"
          loading="lazy"
          className="h-24 w-24 rounded-full object-cover ring-1 ring-[var(--color-border)]"
        />
      ) : (
        <div className="h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xl">
          {initials}
        </div>
      )}
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
      <SectionHeader as="h1" title="About SAHUMäRIO" />
      
      <div className="mt-4 max-w-3xl space-y-4 leading-relaxed text-[var(--color-text)]">
        <p className="font-serif text-2xl">Welcome to SAHUMäRIO.</p>
        <p>
          We're an independent fragrance brand from Rajkot, Gujarat, with a focused collection of
          Eau de Parfum fragrances. Each one has its own name, its own character, and its own look,
          because we want every fragrance to stand on its own.
        </p>
        <p>
          We're still growing, and we'd rather tell you a little less than tell you something we're
          not sure of. So every product detail you see here has been confirmed first. No guesswork,
          no exaggerated claims.
        </p>
        <p>We ship free across India. Thank you for being here.</p>
        <p>
          Follow us on Instagram{" "}
          <a href="https://www.instagram.com/sahumario_fragrance/" target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--color-kesar)] underline-offset-4 hover:underline">
            @sahumario_fragrance
          </a>
          .
        </p>
      </div>

      <h2 className="mt-8 text-xl font-semibold">Our Founders</h2>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FounderCard
          initials="HM"
          photo="/team/harsh-maradiya.jpg"
          name="Harsh Maradiya"
          role="Co-Founder"
          description="Focused on developing the fragrances and growing the collection in India."
        />
        <FounderCard
          initials="NM"
          photo="/team/neel-maradiya.jpg"
          name="Neel Maradiya"
          role="Co-Founder"
          description="Focused on the brand, digital storefront, and customer experience."
        />
      </div>
    </section>
  );
}
