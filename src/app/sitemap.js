import { getProducts } from "../../lib/catalogue";

export default async function sitemap() {
  const products = await getProducts();
  const base = "https://sahumario.com";
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/perfumes`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/bulk-orders`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...products.map(product => ({
      url: `${base}/product/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : now,
      changeFrequency: "monthly",
      priority: 0.8,
    })),
  ];
}
