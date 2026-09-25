import ProductCard from "../../components-next/ProductCard";
import { getProducts } from "../../lib/catalogue";

export const revalidate = 300;

export const metadata = {
  title: "Eau de Parfum Collection",
  description: "Explore the complete SAHUMäRIO® Eau de Parfum collection, fragrance details, notes and current prices.",
  alternates: { canonical: "/perfumes" },
};

export default async function PerfumesPage() {
  const products = await getProducts();

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "SAHUMäRIO® Eau de Parfum Collection",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://sahumario.com/product/${product.slug}`,
      name: product.name,
    })),
  };

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 md:px-12 md:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <div className="border-b border-[var(--color-border)] pb-9 text-center md:pb-12">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">SAHUMäRIO</p>
        <h1 className="mt-4 font-serif text-5xl font-normal tracking-[-0.03em] md:text-7xl">All fragrances</h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[var(--color-muted)]">
          Explore the current SAHUMäRIO® Eau de Parfum collection and open each fragrance for its description and product details.
        </p>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-x-7 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-20 md:mt-14">
        {products.map((product, index) => <ProductCard key={product.id} product={product} priority={index === 0} />)}
      </div>
    </section>
  );
}
