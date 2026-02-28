/**
 * POST /api/payments/promo/validate
 *
 * Validates promo code and returns discount percentage.
 * Expects: { code: string, subtotal?: number }
 * Returns: { valid: boolean, discountPercent?: number, message?: string }
 */

const PROMO_CODE = "WELCOME10";
const PROMO_DISCOUNT_PERCENT = 10;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { code } = req.body || {};
  const promoCode = String(code || "").trim().toUpperCase();

  if (!promoCode) {
    return res.status(400).json({ valid: false, message: "Promo code is required" });
  }

  if (promoCode !== PROMO_CODE) {
    return res.status(404).json({ valid: false, message: "Invalid promo code" });
  }

  return res.status(200).json({
    valid: true,
    discountPercent: PROMO_DISCOUNT_PERCENT,
    message: "Promo validated",
  });
};
