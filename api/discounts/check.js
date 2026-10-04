"use strict";

// Previews a discount code at checkout. The real check happens again when the
// payment is created (api/payments/razorpay/order.js).

const { getServiceClient, setJsonSecurityHeaders, enforceJsonRequest, enforceRateLimit } = require("../_lib/security");
const { checkDiscount } = require("../_lib/discounts");

module.exports = async (req, res) => {
  setJsonSecurityHeaders(res);
  if (!enforceJsonRequest(req, res, { methods: ["POST"], maxBytes: 4 * 1024 })) return;
  if (!(await enforceRateLimit(req, res, { scope: "discount-check", limit: 20, windowSeconds: 600 }))) return;

  try {
    const client = getServiceClient();
    if (!client) return res.status(503).json({ message: "Discount codes are temporarily unavailable." });
    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const result = await checkDiscount(client, { code: body.code, email: body.email, phone: body.phone });
    if (!result.ok) return res.status(400).json({ message: result.message });
    return res.status(200).json({ code: result.code, percent: result.percent });
  } catch (err) {
    console.error("[discounts/check]", err?.message);
    return res.status(500).json({ message: "Unable to check the code right now. Please try again." });
  }
};
