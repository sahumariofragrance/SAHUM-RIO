"use strict";

const { requireCustomer } = require("../_lib/customerAuth");
const {
  getServiceClient,
  setJsonSecurityHeaders,
  enforceJsonRequest,
  enforceRateLimit,
  isPlainObject,
} = require("../_lib/security");
const { removePhotos, photosColumnMissing } = require("../_lib/reviewPhotos");

module.exports = async (req, res) => {
  setJsonSecurityHeaders(res);
  if (!enforceJsonRequest(req, res, { methods: ["POST"], maxBytes: 4 * 1024 })) return;

  try {
    const { user, serverClient } = await requireCustomer(req);
    if (!(await enforceRateLimit(req, res, {
      scope: "review-delete",
      limit: 8,
      windowSeconds: 3600,
      identifier: user.id,
    }))) return;

    const body = isPlainObject(req.body) ? req.body : {};
    const reviewId = Number(body.review_id);
    const productId = Number(body.product_id);

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({ message: "Invalid review" });
    }
    if (body.product_id !== undefined && (!Number.isInteger(productId) || productId <= 0)) {
      return res.status(400).json({ message: "Invalid product" });
    }

    const remove = (fields) => {
      let query = serverClient
        .from("product_reviews")
        .delete()
        .eq("id", reviewId);
      if (Number.isInteger(productId) && productId > 0) query = query.eq("product_id", productId);
      return query.select(fields);
    };

    let { data, error } = await remove("id, photos");
    // Before the review-photos SQL has run there is no photos column (nothing was deleted).
    if (photosColumnMissing(error)) ({ data, error } = await remove("id"));
    if (error) throw error;

    // The review's photos go with it.
    await removePhotos(getServiceClient(), (data || []).flatMap((row) => (Array.isArray(row.photos) ? row.photos : [])));

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ message: "Review not found or you do not have permission to delete it." });
    }

    return res.status(200).json({ deleted: true, id: reviewId });
  } catch (err) {
    console.error("[reviews/delete]", err?.message);
    return res.status(err.statusCode || 500).json({
      message: err.statusCode ? err.message : "Unable to delete review. Please try again.",
    });
  }
};
