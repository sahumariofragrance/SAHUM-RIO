import { notFound } from "next/navigation";
import ProductDetail from "../../../../components-next/ProductDetail";
import { getGalleryUrls, getProductBySlug, getProducts } from "../../../../lib/catalogue";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const products = await getProducts();
    return products.map(product => ({ slug: product.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Perfume Not Found", robots: { index: false, follow: false } };

  return {
    title: `${product.name} Eau de Parfum`,
    description: product.description || `Discover ${product.name}, an Eau de Parfum by SAHUMäRIO®.`,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} Eau de Parfum | SAHUMäRIO®`,
      description: product.description,
      url: `/product/${product.slug}`,
      images: product.image ? [{ url: product.image, alt: product.alt }] : [],
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [product.image].filter(Boolean),
    sku: String(product.id),
    category: "Eau de Parfum",
    brand: { "@type": "Brand", name: "SAHUMäRIO®" },
    offers: {
      "@type": "Offer",
      url: `https://sahumario.com/product/${product.slug}`,
      priceCurrency: "INR",
      price: Number(product.price).toFixed(2),
      seller: { "@type": "Organization", name: "SAHUMäRIO®" },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://sahumario.com/" },
      { "@type": "ListItem", position: 2, name: "Perfumes", item: "https://sahumario.com/perfumes" },
      { "@type": "ListItem", position: 3, name: product.name, item: `https://sahumario.com/product/${product.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ProductDetail product={product} galleryUrls={getGalleryUrls(product)} />
    </>
  );
}
