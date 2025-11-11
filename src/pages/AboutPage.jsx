import React from 'react';

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h3 className="text-2xl md:text-3xl font-semibold">About Sahumärio</h3>
      <p className="mt-3 text-gray-700">
        Welcome to Sahumärio, where tradition meets luxury. We specialize in crafting
        authentic oil-based perfumes that are designed to last throughout your day and beyond.
      </p>
      <p className="mt-2 text-gray-700">
        Our perfumes are carefully formulated using the finest natural ingredients, ensuring a
        rich, long-lasting fragrance experience that synthetic alternatives simply cannot match.
      </p>

      <h4 className="mt-8 text-xl font-semibold">Our Founders</h4>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 p-6">
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">HM</div>
          <h5 className="mt-3 text-lg font-medium">Harsh Maradiya</h5>
          <p className="text-sm text-gray-600">Co-Founder</p>
          <p className="mt-2 text-gray-700">Passionate about bringing authentic fragrances to discerning customers worldwide.</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6">
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">NM</div>
          <h5 className="mt-3 text-lg font-medium">Neel Maradiya</h5>
          <p className="text-sm text-gray-600">Co-Founder</p>
          <p className="mt-2 text-gray-700">Dedicated to crafting perfumes that create lasting impressions and memories.</p>
        </div>
      </div>
    </section>
  );
}
