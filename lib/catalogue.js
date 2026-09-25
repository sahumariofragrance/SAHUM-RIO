import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase catalogue environment is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function normalizeProduct(product) {
  return {
    ...product,
    id: Number(product.id),
    price: Number(product.price),
    image: product.image_url || "",
    alt: `${product.name} Eau de Parfum bottle`,
  };
}

const FIELDS = "id,slug,name,description,price,image_url,alt,notes,size_volume,fragrance_family,scent_profile,occasion,active,display_order,updated_at";

export async function getProducts() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(FIELDS)
    .eq("active", true)
    .order("display_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return (data || []).map(normalizeProduct);
}

export async function getProductBySlug(slug) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(FIELDS)
    .eq("active", true)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeProduct(data) : null;
}

export function getGalleryUrls(product) {
  if (!product?.image) return [];
  const marker = "/storage/v1/object/public/product-images/";
  const image = String(product.image);
  let parent = `gallery/${product.slug}`;

  if (image.includes(marker)) {
    const objectPath = decodeURIComponent((image.split(marker)[1] || "").split("?")[0]);
    const slash = objectPath.lastIndexOf("/");
    if (objectPath.startsWith("gallery/") && slash > 0) parent = objectPath.slice(0, slash);
  }

  const base = (process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || "").replace(/\/$/, "");
  const gallery = Array.from({ length: 5 }, (_, i) =>
    `${base}/storage/v1/object/public/product-images/${parent}/${i + 1}`
  );

  return [...new Set([product.image, ...gallery].filter(Boolean))];
}
