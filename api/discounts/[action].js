"use strict";

// POST /api/discounts/check — previews a discount code at checkout. The real
// check happens again when the payment is created (api/payments/razorpay/order.js).
//
// POST /api/discounts/spin — spins the wheel shown before checkout. The server
// picks the prize and saves it under a one-off code (../_lib/spin.js); the
// website only turns the wheel to the segment returned. Checkout checks the
// code again, with the customer's email and phone.
//
// One function serves both: Vercel's Hobby plan allows 12 per deployment.

const { getServiceClient, setJsonSecurityHeaders, enforceJsonRequest, enforceRateLimit } = require("../_lib/security");
const { rejectBots } = require("../_lib/botCheck");
const { checkDiscount } = require("../_lib/discounts");
const { wheel, newSpinCode, pickSegment } = require("../_lib/spin");

const DAY_MS = 24 * 60 * 60 * 1000;

async function check(req, res) {
  if (!enforceJsonRequest(req, res, { methods: ["POST"], maxBytes: 4 * 1024 })) return;
  if (!(await enforceRateLimit(req, res, { scope: "discount-check", limit: 20, windowSeconds: 600 }))) return;

  try {
    const client = getServiceClient();
    if (!client) return res.status(503).json({ message: "Discount codes are temporarily unavailable." });
    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const result = await checkDiscount(client, { code: body.code, email: body.email, phone: body.phone });
    if (!result.ok) return res.status(400).json({ message: result.message });
    return res.status(200).json({ code: result.code, percent: result.percent, includeTesters: result.includeTesters });
  } catch (err) {
    console.error("[discounts/check]", err?.message);
    return res.status(500).json({ message: "Unable to check the code right now. Please try again." });
  }
}

async function spin(req, res) {
  if (!enforceJsonRequest(req, res, { methods: ["POST"], maxBytes: 1024 })) return;
  if (!(await rejectBots(req, res))) return;
  if (!(await enforceRateLimit(req, res, { scope: "spin-wheel", limit: 20, windowSeconds: 600 }))) return;

  try {
    const client = getServiceClient();
    if (!client) return res.status(503).json({ message: "The spin wheel is resting right now." });

    const { data: open, error: openError } = await client.rpc("spin_wheel_open");
    if (openError) throw openError;
    if (open !== true) return res.status(409).json({ message: "The spin wheel is closed right now.", closed: true });

    const segment = pickSegment();
    const { percent = null, testers = null } = wheel.segments[segment];
    const expiresAt = new Date(Date.now() + wheel.validDays * DAY_MS).toISOString();
    // A clash with an existing code is very unlikely; try a fresh one if so.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const code = newSpinCode();
      const { error } = await client.from("spin_prizes").insert({ code, percent, testers, expires_at: expiresAt });
      if (!error) return res.status(200).json({ segment, code, percent, testers, expiresAt });
      if (error.code !== "23505") throw error;
    }
    throw new Error("could not create a unique prize code");
  } catch (err) {
    console.error("[discounts/spin]", err?.message);
    return res.status(500).json({ message: "The wheel couldn't spin just now. Please try again." });
  }
}

module.exports = async (req, res) => {
  setJsonSecurityHeaders(res);
  const action = String(req.query?.action || "");
  if (action === "check") return check(req, res);
  if (action === "spin") return spin(req, res);
  return res.status(404).json({ message: "Not found" });
};
