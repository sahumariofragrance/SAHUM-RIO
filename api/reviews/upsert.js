"use strict";

const { requireCustomer } = require("../_lib/customerAuth");
const {
  setJsonSecurityHeaders,
  enforceJsonRequest,
  enforceRateLimit,
  isPlainObject,
  safeString,
} = require("../_lib/security");

function safeInt(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : NaN;
}

module.exports = async (req, res) => {
  setJsonSecurityHeaders(res);
  if (!enforceJsonRequest(req, res, { methods: ["POST"], maxBytes: 8 * 1024 })) return;

  try {
    const { user, serverClient } = await requireCustomer(req);
    if (!(await enforceRateLimit(req, res, {
      scope: "review-write",
      limit: 8,
      windowSeconds: 3600,
      identifier: user.id,
    }))) return;

    const body = isPlainObject(req.body) ? req.body : {};
    const productId = safeInt(body.product_id);
    const displayName = safeString(body.display_name, 60);
    const title = safeString(body.title, 100);
    const reviewBody = safeString(body.body, 1200);
    const rating = safeInt(body.rating);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: "Invalid product" });
    }
    if (displayName.length < 2) {
      return res.status(400).json({ message: "Display name must be at least 2 characters" });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }
    if (reviewBody.length < 5) {
      return res.status(400).json({ message: "Review must be at least 5 characters" });
    }

    const { data: product, error: productError } = await serverClient
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("active", true)
      .maybeSingle();
    if (productError) throw productError;
    if (!product) return res.status(404).json({ message: "Product is unavailable" });

    const { data: existing, error: existingError } = await serverClient
      .from("product_reviews")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existingError) throw existingError;

    const payload = {
      display_name: displayName,
      rating,
      title,
      body: reviewBody,
      updated_at: new Date().toISOString(),
    };

    let query;
    if (existing?.id) {
      query = serverClient
        .from("product_reviews")
        .update(payload)
        .eq("id", existing.id)
        .eq("user_id", user.id)
        .select("id")
        .single();
    } else {
      query = serverClient
        .from("product_reviews")
        .insert({ ...payload, product_id: productId, user_id: user.id })
        .select("id")
        .single();
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ message: "A review already exists. Please refresh and try again." });
      }
      throw error;
    }

    return res.status(existing?.id ? 200 : 201).json({ saved: true, id: data.id });
  } catch (err) {
    console.error("[reviews/upsert]", err?.message);
    return res.status(err.statusCode || 500).json({
      message: err.statusCode ? err.message : "Unable to save review. Please try again.",
    });
  }
};
