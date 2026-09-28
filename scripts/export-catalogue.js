// Exports the live catalogue (visible products) from Supabase into
// src/data/products.json, the backup catalogue the site shows if the
// database cannot be reached. Run daily by .github/workflows/catalogue-backup.yml.
//
// Uses the public (anon) key, so it reads exactly what customers can see.
// Env: SUPABASE_URL, SUPABASE_ANON_KEY. Exits non-zero, without touching the
// file, if the export fails or looks wrong.
const fs = require("fs");
const path = require("path");

const FIELDS = [
  "id", "slug", "name", "description", "price", "image_url", "gallery_urls", "alt", "notes",
  "size_volume", "fragrance_family", "scent_profile", "occasion", "display_order", "updated_at",
];
const OUTPUT = path.join(__dirname, "..", "src", "data", "products.json");

async function main() {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");

  const query = `select=${FIELDS.join(",")}&active=eq.true&order=display_order.asc,id.asc`;
  const response = await fetch(`${url}/rest/v1/products?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) throw new Error(`Supabase returned ${response.status}: ${(await response.text()).slice(0, 200)}`);
  const rows = await response.json();

  if (!Array.isArray(rows) || rows.length === 0) throw new Error("No products returned; keeping the existing file");
  for (const row of rows) {
    if (!row.id || !row.slug || !row.name || !(Number(row.price) > 0) || !row.image_url) {
      throw new Error(`Product ${row.id || "?"} is missing required fields; keeping the existing file`);
    }
  }

  const products = rows.map((row) => {
    const product = { ...row, price: Number(row.price), image: row.image_url };
    delete product.updated_at;
    for (const key of Object.keys(product)) if (product[key] === null) delete product[key];
    return product;
  });

  const next = `${JSON.stringify(products, null, 2)}\n`;
  const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, "utf8") : "";
  if (next === current) {
    console.log(`Catalogue unchanged (${products.length} products).`);
    return;
  }
  fs.writeFileSync(OUTPUT, next);
  console.log(`Catalogue updated: ${products.length} products written to src/data/products.json.`);
}

main().catch((error) => {
  console.error(`Catalogue export failed: ${error.message}`);
  process.exit(1);
});
