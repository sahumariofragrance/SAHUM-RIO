import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import fallbackProducts from "../data/products.json";

const ProductsContext = createContext(null);

const PRODUCT_FIELDS = "id,slug,name,description,price,image_url,alt,notes,size_volume,fragrance_family,scent_profile,occasion,active,display_order,updated_at";

function withImageVersion(url, updatedAt) {
  const value = String(url || "");
  if (!value || !updatedAt) return value;
  const version = encodeURIComponent(String(updatedAt));
  return value + (value.includes("?") ? "&" : "?") + "v=" + version;
}

function normalizeProduct(product) {
  const alt = String(product.alt || `${product.name} Eau de Parfum bottle`)
    .replace(/oil-based perfume/gi, "Eau de Parfum");

  const image = withImageVersion(product.image_url || product.image, product.updated_at);
  const stored = Array.isArray(product.gallery_urls) ? product.gallery_urls.filter(Boolean) : [];
  // gallery[0] is the cover; it uses the versioned URL so it matches `image`.
  const gallery = stored.length
    ? [image, ...stored.filter((url) => url !== product.image_url && url !== product.image)]
    : [image].filter(Boolean);

  return {
    ...product,
    id: Number(product.id),
    price: Number(product.price),
    image,
    gallery,
    alt,
  };
}

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    const query = (fields) => supabase
      .from("products")
      .select(fields)
      .eq("active", true)
      .order("display_order", { ascending: true })
      .order("id", { ascending: true });
    let { data, error: queryError } = await query(`${PRODUCT_FIELDS},gallery_urls`);
    // Before the gallery_urls migration runs, load without it rather than falling back.
    if (queryError && /gallery_urls/.test(queryError.message || "")) ({ data, error: queryError } = await query(PRODUCT_FIELDS));

    if (queryError) {
      setError("Live catalogue could not be refreshed. Showing the saved collection.");
      setProducts(fallbackProducts.map(normalizeProduct));
    } else {
      setProducts((data || []).map(normalizeProduct));
    }
    setLoading(false);
  }, []);

  useEffect(() => { refreshProducts(); }, [refreshProducts]);

  const bySlug = useMemo(() => {
    const map = new Map();
    products.forEach((product) => map.set(product.slug, product));
    return map;
  }, [products]);

  return (
    <ProductsContext.Provider value={{ products, loading, error, refreshProducts, bySlug }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used inside <ProductsProvider>");
  return ctx;
}
