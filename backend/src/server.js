const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 8000);
const TOKEN_SECRET = process.env.TOKEN_SECRET || "dev-secret-change-me";
const DATA_DIR = path.resolve(__dirname, "../data");
const USERS_PATH = path.join(DATA_DIR, "users.json");
const PRODUCTS_PATH = path.join(DATA_DIR, "products.json");
const ORDERS_PATH = path.join(DATA_DIR, "orders.json");
const CARTS_PATH = path.join(DATA_DIR, "carts.json");

app.use(express.json({ limit: "1mb" }));

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(value) {
  return crypto.createHmac("sha256", TOKEN_SECRET).update(value).digest("base64url");
}

function createToken(user) {
  const payload = JSON.stringify({ uid: user.id, exp: Date.now() + 7 * 24 * 3600 * 1000 });
  const encoded = b64url(payload);
  return `${encoded}.${sign(encoded)}`;
}

function verifyToken(token) {
  const [encoded, signature] = String(token || "").split(".");
  if (!encoded || !signature || sign(encoded) !== signature) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload?.uid || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const testHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
}

async function readJson(filePath, fallback = []) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

function sanitizeUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role || "customer" };
}

async function createSupabaseAdapter() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(url, key, { auth: { persistSession: false } });

    return {
      mode: "supabase-postgres",
      async getUsers() {
        const { data, error } = await sb.from("users").select("*");
        if (error) throw new Error(error.message);
        return data || [];
      },
      async saveUsers(users) {
        const { error: delErr } = await sb.from("users").delete().neq("id", -1);
        if (delErr) throw new Error(delErr.message);
        if (!users.length) return;
        const { error } = await sb.from("users").insert(users);
        if (error) throw new Error(error.message);
      },
      async getProducts() {
        const { data, error } = await sb.from("products").select("*").order("id", { ascending: true });
        if (error) throw new Error(error.message);
        return data || [];
      },
      async saveProducts(products) {
        const { error: delErr } = await sb.from("products").delete().neq("id", -1);
        if (delErr) throw new Error(delErr.message);
        if (!products.length) return;
        const { error } = await sb.from("products").insert(products);
        if (error) throw new Error(error.message);
      },
      async getOrders() {
        const { data, error } = await sb.from("orders").select("*");
        if (error) throw new Error(error.message);
        return data || [];
      },
      async saveOrders(orders) {
        const { error: delErr } = await sb.from("orders").delete().neq("id", "");
        if (delErr) throw new Error(delErr.message);
        if (!orders.length) return;
        const { error } = await sb.from("orders").insert(orders);
        if (error) throw new Error(error.message);
      },
      async getCarts() {
        const { data, error } = await sb.from("carts").select("*");
        if (error) throw new Error(error.message);
        return data || [];
      },
      async saveCarts(carts) {
        const { error: delErr } = await sb.from("carts").delete().neq("userId", -1);
        if (delErr) throw new Error(delErr.message);
        if (!carts.length) return;
        const { error } = await sb.from("carts").insert(carts);
        if (error) throw new Error(error.message);
      },
    };
  } catch {
    return null;
  }
}

function createJsonAdapter() {
  return {
    mode: "json-fallback",
    getUsers: () => readJson(USERS_PATH),
    saveUsers: (users) => writeJson(USERS_PATH, users),
    getProducts: () => readJson(PRODUCTS_PATH),
    saveProducts: (products) => writeJson(PRODUCTS_PATH, products),
    getOrders: () => readJson(ORDERS_PATH),
    saveOrders: (orders) => writeJson(ORDERS_PATH, orders),
    getCarts: () => readJson(CARTS_PATH),
    saveCarts: (carts) => writeJson(CARTS_PATH, carts),
  };
}

let db = createJsonAdapter();

async function initDb() {
  const supabaseAdapter = await createSupabaseAdapter();
  db = supabaseAdapter || createJsonAdapter();
  console.log(`[DB] Using ${db.mode}`);
}

async function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ message: "Invalid token" });

  const users = await db.getUsers();
  const user = users.find((u) => u.id === payload.uid);
  if (!user) return res.status(401).json({ message: "Invalid token" });

  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin access required" });
  next();
}

app.get("/api/health", (_req, res) => res.json({ ok: true, db: db.mode }));

app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ message: "name, email and password are required" });

  const users = await db.getUsers();
  const normalizedEmail = String(email).trim().toLowerCase();
  if (users.some((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const user = {
    id: Date.now(),
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: users.length === 0 ? "admin" : "customer",
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await db.saveUsers(users);
  await db.saveCarts([...(await db.getCarts()), { userId: user.id, items: [], updatedAt: new Date().toISOString() }]);
  res.status(201).json({ token: createToken(user), user: sanitizeUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "email and password are required" });

  const users = await db.getUsers();
  const user = users.find((u) => u.email === String(email).trim().toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({ token: createToken(user), user: sanitizeUser(user) });
});

app.get("/api/auth/me", auth, async (req, res) => res.json({ user: sanitizeUser(req.user) }));
app.get("/api/products", async (_req, res) => res.json({ products: await db.getProducts() }));

app.post("/api/products", auth, requireAdmin, async (req, res) => {
  const { name, description, price, image, alt } = req.body || {};
  if (!name || !description || !price || !image || !alt) {
    return res.status(400).json({ message: "name, description, price, image, alt are required" });
  }
  const products = await db.getProducts();
  const product = {
    id: Math.max(0, ...products.map((p) => Number(p.id) || 0)) + 1,
    name: String(name).trim(),
    description: String(description).trim(),
    price: Number(price),
    image: String(image).trim(),
    alt: String(alt).trim(),
  };
  products.push(product);
  await db.saveProducts(products);
  res.status(201).json({ product });
});

app.put("/api/products/:id", auth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const products = await db.getProducts();
  const index = products.findIndex((p) => Number(p.id) === id);
  if (index === -1) return res.status(404).json({ message: "Product not found" });

  products[index] = { ...products[index], ...req.body, id };
  await db.saveProducts(products);
  res.json({ product: products[index] });
});

app.delete("/api/products/:id", auth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const products = await db.getProducts();
  const next = products.filter((p) => Number(p.id) !== id);
  if (next.length === products.length) return res.status(404).json({ message: "Product not found" });
  await db.saveProducts(next);
  res.status(204).send();
});

app.get("/api/cart", auth, async (req, res) => {
  const carts = await db.getCarts();
  const cart = carts.find((c) => c.userId === req.user.id) || { userId: req.user.id, items: [] };
  res.json({ items: cart.items || [] });
});

app.put("/api/cart", auth, async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ message: "items array required" });

  const carts = await db.getCarts();
  const next = carts.filter((c) => c.userId !== req.user.id);
  next.push({ userId: req.user.id, items, updatedAt: new Date().toISOString() });
  await db.saveCarts(next);
  res.json({ items });
});

app.get("/api/orders", auth, async (req, res) => {
  const orders = await db.getOrders();
  const myOrders = orders.filter((o) => o.userId === req.user.id);
  res.json({ orders: myOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

app.post("/api/orders", auth, async (req, res) => {
  const { items, subtotal, total, address, payment, promoCode = null, discountPercent = 0 } = req.body || {};
  if (!Array.isArray(items) || !items.length || !address || !payment) {
    return res.status(400).json({ message: "items, address and payment are required" });
  }

  const orders = await db.getOrders();
  const order = {
    id: `ORD-${Date.now()}`,
    userId: req.user.id,
    items,
    subtotal: Number(subtotal) || 0,
    total: Number(total) || Number(subtotal) || 0,
    promoCode,
    discountPercent: Number(discountPercent) || 0,
    address,
    payment,
    createdAt: new Date().toISOString(),
  };

  orders.push(order);
  await db.saveOrders(orders);

  const carts = await db.getCarts();
  const clearedCarts = carts.map((c) => (c.userId === req.user.id ? { ...c, items: [], updatedAt: new Date().toISOString() } : c));
  await db.saveCarts(clearedCarts);

  res.status(201).json({ order });
});

app.post("/api/payments/razorpay/order", async (req, res) => {
  const { amount, currency = "INR" } = req.body || {};
  if (!amount || Number(amount) <= 0) return res.status(400).json({ message: "Valid amount is required" });
  res.json({ id: `order_${Date.now()}`, amount: Number(amount), currency });
});

app.post("/api/payments/razorpay/verify", async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id } = req.body || {};
  if (!razorpay_payment_id || !razorpay_order_id) {
    return res.status(400).json({ message: "Payment verification payload missing" });
  }
  res.json({ verified: true });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

initDb().finally(() => {
  app.listen(PORT, () => {
    console.log(`Backend API running on http://localhost:${PORT}`);
  });
});
