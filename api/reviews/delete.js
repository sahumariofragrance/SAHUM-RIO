"use strict";

const { requireCustomer } = require("../_lib/customerAuth");
const {
  getServiceClient,
  setJsonSecurityHeaders,
  enforceJsonRequest,
  enforceRateLimit,
  isPlainObject,
} = require("../_lib/security");

module.exports = async (req, res) => {
  setJsonSecurityHeaders(res);
  if (!enforceJsonRequest(req, res, { methods: ["POST"], maxBytes: 4 * 1024 })) return;

  try {
    const { user } = await requireCustomer(req);
    if (!(await enforceRateLimit(req, res, {
      scope: "review-delete",
      limit: 8,
      windowSeconds: 3600,
      identifier: user.id,
    }))) return;

    const body = isPlainObject(req.body) ? req.body : {};
    const productId = Number(body.product_id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: "Invalid product" });
    }

    const serviceClient = getServiceClient();
    if (!serviceClient) return res.status(503).json({ message: "Review service is temporarily unavailable" });

    const { error } = await serviceClient
      .from("product_reviews")
      .delete()
      .eq("product_id", productId)
      .eq("user_id", user.id);
    if (error) throw error;

    return res.status(200).json({ deleted: true });
  } catch (err) {
    console.error("[reviews/delete]", err?.message);
    return res.status(err.statusCode || 500).json({
      message: err.statusCode ? err.message : "Unable to delete review. Please try again.",
    });
  }
};
