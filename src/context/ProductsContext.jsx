import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import fallbackProducts from "../data/products.json";

const ProductsContext = createContext(null);

function withImageVersion(url, updatedAt) {
  const value = String(url || "");
  if (!value || !updatedAt) return value;
  const version = encodeURIComponent(String(updatedAt));
  return value + (value.includes("?") ? "&" : "?") + "v=" + version;
}

function normalizeProduct(product) {
  const alt = String(product.alt || `${product.name} Eau de Parfum bottle`)
    .replace(/oil-based perfume/gi, "Eau de Parfum");

  return {
    ...product,
    id: Number(product.id),
    price: Number(product.price),
    image: withImageVersion(product.image_url || product.image, product.updated_at),
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
    const { data, error: queryError } = await supabase
      .from("products")
      .select("id,slug,name,description,price,image_url,alt,notes,size_volume,fragrance_family,scent_profile,occasion,active,display_order,updated_at")
      .eq("active", true)
      .order("display_order", { ascending: true })
      .order("id", { ascending: true });

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
