/** POST /api/payments/razorpay/order — creates a server-priced Razorpay order and durable payment intent. */
"use strict";
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { requireCustomer } = require("../../_lib/customerAuth");
const { getServiceClient, setJsonSecurityHeaders, enforceJsonRequest, enforceRateLimit } = require("../../_lib/security");
const { rejectBots } = require("../../_lib/botCheck");
const { checkDiscount, discountPaise, normalizeEmail, normalizePhone } = require("../../_lib/discounts");
const { loadOffer, comboDiscountPaise, isSampleSetSlug } = require("../../_lib/offers");
const { checkSpinPrize, isSpinCode, wheel } = require("../../_lib/spin");
const { isTesterId, perfumeIdOf, testerLines } = require("../../_lib/testers");

const MAX_QTY_PER_ITEM = 20;
const MAX_TOTAL_ITEMS = 50;
const MAX_AMOUNT_PAISE = 50_000_000;
const MIN_AMOUNT_PAISE = 100;
let razorpayClient = null;

function getRazorpayClient() {
  if (razorpayClient) return razorpayClient;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  razorpayClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return razorpayClient;
}
function setSecurityHeaders(res) {
  setJsonSecurityHeaders(res);
}
function sanitizeText(value, max = 120) { return value == null ? "" : String(value).replace(/[\u0000-\u001F\u007F\r\n\t]/g, " ").trim().slice(0, max); }
function safeInt(value) { return typeof value === "number" && Number.isInteger(value) ? value : typeof value === "string" && /^\d+$/.test(value.trim()) ? parseInt(value, 10) : NaN; }
function plain(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
function cartHash(userId, items) {
  const canonical = items.map((item) => `${item.product_id}:${item.qty}`).sort().join("|");
  return crypto.createHash("sha256").update(`${userId}|${canonical}`).digest("hex");
}
function safeAddress(address, user) {
  const source = plain(address) ? address : {};
  return {
    name: sanitizeText(source.name, 120),
    phone: sanitizeText(source.phone, 30),
    email: sanitizeText(source.email || user.email, 200),
    address: sanitizeText(source.address, 300),
    city: sanitizeText(source.city, 100),
    state: sanitizeText(source.state, 100),
    pin: sanitizeText(source.pin, 20),
  };
}

module.exports = async (req, res) => {
  setSecurityHeaders(res);
  if (!enforceJsonRequest(req, res, { methods: ["POST"], maxBytes: 24 * 1024 })) return;
  if (!(await rejectBots(req, res))) return;

  try {
    const { user, serverClient } = await requireCustomer(req);
    if (!(await enforceRateLimit(req, res, {
      scope: "razorpay-order",
      limit: 12,
      windowSeconds: 600,
      identifier: user.id,
    }))) return;
    const body = plain(req.body) ? req.body : {};
    const { items, frontendAmount, currency = "INR", customer = {}, address, discount_code: discountCode, spin_code: spinCode, testers } = body;
    if (currency !== "INR") return res.status(400).json({ message: "Unsupported currency" });
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "items must be a non-empty array" });

    const ids = items.map((item) => safeInt(item?.product_id));
    if (ids.some((id) => !Number.isInteger(id) || id <= 0)) return res.status(400).json({ message: "Invalid product ID" });
    // Free testers won on the spin wheel are looked up with the bag.
    const testerIds = spinCode && Array.isArray(testers) ? testers.slice(0, 10).map((id) => safeInt(id)) : [];
    // A 10 ml tester in the bag (../../_lib/testers.js) is looked up as its perfume.
    const lookupIds = [...new Set([...ids.map((id) => (isTesterId(id) ? perfumeIdOf(id) : id)), ...testerIds.filter((id) => Number.isInteger(id) && id > 0)])];
    const catalogueQuery = (fields) => serverClient.from("products").select(fields).in("id", lookupIds).eq("active", true);
    let { data: catalogueRows, error: catalogueError } = await catalogueQuery("id,name,slug,price,active,coming_soon");
    // Before the coming-soon migration runs there is no such column: every perfume is on sale.
    if (catalogueError && /coming_soon/.test(catalogueError.message || "")) ({ data: catalogueRows, error: catalogueError } = await catalogueQuery("id,name,slug,price,active"));
    if (catalogueError) throw catalogueError;
    const catalogue = new Map((catalogueRows || []).map((product) => [Number(product.id), { name: product.name, slug: product.slug, price: Number(product.price), comingSoon: Boolean(product.coming_soon) }]));

    const seen = new Set(); let count = 0; let amountPaise = 0;
    const normalizedItems = [];
    const bagTesters = [];
    for (const item of items) {
      if (!plain(item)) return res.status(400).json({ message: "Invalid item" });
      const id = safeInt(item.product_id); const qty = safeInt(item.qty);
      const tester = isTesterId(id);
      const product = catalogue.get(tester ? perfumeIdOf(id) : id);
      if (!product || (tester && isSampleSetSlug(product.slug))) return res.status(400).json({ message: `Product ${item.product_id} is unavailable` });
      if (product.comingSoon) return res.status(400).json({ message: `${product.name} is coming soon and can't be ordered yet. Please remove it from your bag.` });
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) return res.status(400).json({ message: "Invalid quantity" });
      if (seen.has(id)) return res.status(400).json({ message: `Duplicate product_id ${id}` });
      // Testers are priced together below: every few of them make a set.
      if (tester) { seen.add(id); count += qty; bagTesters.push({ product_id: id, perfume: product.name, qty }); continue; }
      const unitPaise = Math.round(Number(product.price) * 100);
      if (!Number.isSafeInteger(unitPaise) || unitPaise < MIN_AMOUNT_PAISE) {
        return res.status(409).json({ message: `Product ${id} has an invalid price` });
      }
      seen.add(id);
      count += qty;
      amountPaise += unitPaise * qty;
      normalizedItems.push({ product_id: id, name: product.name, price: unitPaise / 100, qty });
    }
    let testerPaise = 0;
    if (bagTesters.length) {
      const testers = testerLines(bagTesters);
      normalizedItems.push(...testers.lines);
      amountPaise += testers.paise;
      testerPaise = testers.paise;
    }
    if (count > MAX_TOTAL_ITEMS) return res.status(400).json({ message: "Cart quantity is too large" });
    const amountINR = amountPaise / 100;
    if (!Number.isSafeInteger(amountPaise) || amountPaise < MIN_AMOUNT_PAISE || amountPaise > MAX_AMOUNT_PAISE) {
      return res.status(400).json({ message: "Order amount is outside the allowed range" });
    }

    const shipping = safeAddress(address, user);
    if (!shipping.name || !shipping.phone || !shipping.email || !shipping.address || !shipping.city || !shipping.state || !shipping.pin) {
      return res.status(400).json({ message: "Shipping address and email are required" });
    }
    if (!/^\d{10}$/.test(shipping.phone.replace(/\D/g, ""))) {
      return res.status(400).json({ message: "A valid 10-digit phone number is required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) {
      return res.status(400).json({ message: "A valid email address is required" });
    }
    if (!/^\d{6}$/.test(shipping.pin)) {
      return res.status(400).json({ message: "A valid 6-digit PIN code is required" });
    }

    const serviceClient = getServiceClient();
    if (!serviceClient) return res.status(503).json({ message: "Checkout service is temporarily unavailable." });

    // A discount code is checked here, on the server, for this email and phone.
    // Offers don't combine: a code is used only when it saves more than the
    // any-2 offer (switched on in Admin → Discounts), otherwise the offer
    // applies and the code stays unused.
    const combo = await loadOffer(serviceClient);
    // Perfume bottles only: not discovery boxes, testers or tester sets.
    const bottles = normalizedItems.filter((item) => catalogue.has(item.product_id) && !isSampleSetSlug(catalogue.get(item.product_id).slug));
    const comboPaise = comboDiscountPaise(bottles, combo);
    let discount = null;
    let spinDiscountCode = false;
    if (discountCode) {
      const checked = await checkDiscount(serviceClient, { code: discountCode, email: shipping.email, phone: shipping.phone });
      if (!checked.ok) return res.status(400).json({ message: checked.message, discountRejected: true });
      spinDiscountCode = checked.spin;
      // 50 ml perfumes only, unless the code is switched on for testers too.
      const off = discountPaise(checked.includeTesters ? amountPaise : amountPaise - testerPaise, checked.percent);
      if (off > comboPaise) discount = { code: checked.code, percent: checked.percent, paise: off, spin: checked.spin };
    }

    // A spin wheel prize (../../_lib/spin.js). A percentage off comes in as the
    // discount code above and, like any code, is used only when it saves the
    // most. A free tester comes in as spin_code with the perfume chosen: a
    // gift, so it goes with any offer or code. One spin prize per order.
    let spinUsed = discount?.spin ? discount.code : null;
    let freeTesters = null;
    if (spinCode) {
      const code = String(spinCode).trim().toUpperCase();
      if (spinDiscountCode) return res.status(400).json({ message: "Only one spin-wheel prize can be used per order.", spinRejected: true });
      if (!isSpinCode(code)) return res.status(400).json({ message: "That spin prize code isn't valid.", spinRejected: true });
      const checked = await checkSpinPrize(serviceClient, { code, email: normalizeEmail(shipping.email), phone: normalizePhone(shipping.phone) });
      if (!checked.ok) return res.status(400).json({ message: checked.message, spinRejected: true });
      if (!checked.prize.testers) return res.status(400).json({ message: "This spin prize is a discount. Apply it as a discount code.", spinRejected: true });
      const wanted = checked.prize.testers;
      if (!bottles.length) {
        return res.status(400).json({ message: `${wanted === 1 ? "The free Jhalak comes" : "The free Jhalak come"} with a perfume bottle. Please add one to your bag.`, testersRejected: true });
      }
      const chosen = testerIds.map((id) => catalogue.get(id));
      const valid = chosen.length === wanted
        && new Set(testerIds).size === wanted
        && chosen.every((product) => product && !product.comingSoon && !isSampleSetSlug(product.slug))
        && testerIds.every((id) => !seen.has(id));
      if (!valid) {
        const message = wanted === 1
          ? "Please choose one perfume, not in your bag, for your free Jhalak."
          : `Please choose ${wanted} different perfumes, not in your bag, for your free Jhalak.`;
        return res.status(400).json({ message, testersRejected: true });
      }
      freeTesters = testerIds.map((id) => ({ product_id: id, name: catalogue.get(id).name, ml: wheel.testerMl }));
      spinUsed = checked.prize.code;
    }
    // The offer has no code: its name is saved in the code field so the order
    // card, emails and PDF show it. No discount code has that name (codes are
    // capital letters and digits), so no code redemption is recorded.
    if (!discount && comboPaise > 0) discount = { code: combo.label, offer: true, percent: null, paise: comboPaise };
    const amount = amountPaise - (discount ? discount.paise : 0);
    if (!Number.isSafeInteger(amount) || amount < MIN_AMOUNT_PAISE) {
      return res.status(400).json({ message: "Order amount is outside the allowed range" });
    }

    const frontend = Number(frontendAmount);
    const mismatch = Number.isInteger(frontend) && frontend !== amount;
    const razorpay = getRazorpayClient();
    if (!razorpay) return res.status(500).json({ message: "Payment gateway is not configured. Please contact support." });

    const safeCustomer = plain(customer) ? customer : {};
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `rcpt_${crypto.randomBytes(8).toString("hex")}`,
      notes: {
        user_id: user.id,
        customer_name: sanitizeText(safeCustomer.name),
        customer_phone: sanitizeText(safeCustomer.phone, 20),
        customer_email: sanitizeText(safeCustomer.email || user.email, 200),
        server_verified_amount_inr: String(amountINR),
        total_qty: String(count),
        cart_hash: cartHash(user.id, normalizedItems),
        intent_version: "3",
        ...(discount && !discount.offer ? { discount_code: discount.code, discount_percent: String(discount.percent) } : {}),
        ...(discount?.offer ? { offer: discount.code, offer_discount_inr: String(discount.paise / 100) } : {}),
        ...(spinUsed ? { spin_code: spinUsed } : {}),
        ...(freeTesters ? { free_testers: freeTesters.map((tester) => `${tester.name} ${tester.ml} ml`).join(", ").slice(0, 250) } : {}),
      },
    });

    const intent = await serviceClient.from("payment_intents").insert({
      razorpay_order_id: order.id,
      user_id: user.id,
      items: normalizedItems,
      subtotal: amountINR,
      amount_paise: amount,
      currency: "INR",
      address: shipping,
      customer_email: shipping.email,
      status: "created",
      // Only when a code, offer or spin prize is used, so checkout never depends on these columns otherwise.
      ...(discount ? { discount_code: discount.code, discount_percent: discount.percent, discount_amount: discount.paise / 100 } : {}),
      ...(spinUsed ? { spin_code: spinUsed } : {}),
      ...(freeTesters ? { free_testers: freeTesters } : {}),
    });
    if (intent.error) {
      console.error("[order] payment intent persistence failed", intent.error.message);
      return res.status(503).json({ message: "Unable to prepare a recoverable payment. No payment was taken; please try again." });
    }

    const response = { id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt };
    if (discount && !discount.offer) response.discount = { code: discount.code, percent: discount.percent, amount: discount.paise / 100 };
    if (discount?.offer) response.offer = { label: discount.code, amount: discount.paise / 100 };
    if (mismatch) response.correctedAmount = amount / 100;
    return res.status(200).json(response);
  } catch (err) {
    console.error("[order]", err?.message);
    return res.status(err.statusCode || 502).json({ message: err.statusCode ? err.message : "Unable to create payment order. Please try again." });
  }
};
