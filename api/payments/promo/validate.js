/**
 * POST /api/payments/promo/validate
 *
 * Validates promo code and returns discount percentage.
 * Expects: { code: string, subtotal?: number }
 * Returns: { valid: boolean, discountPercent?: number, message?: string }
 */

const DEFAULT_CODES = {
  SAHUM10: 10,
  WELCOME15: 15,
  FRAGRANCE20: 20,
};

function resolvePromoMap() {
  const raw = process.env.PROMO_CODES_JSON;
  if (!raw) return DEFAULT_CODES;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULT_CODES;

    return Object.entries(parsed).reduce((acc, [code, discount]) => {
      const percent = Number(discount);
      if (Number.isFinite(percent) && percent > 0) {
        acc[String(code).trim().toUpperCase()] = percent;
      }
      return acc;
    }, {});
  } catch {
    return DEFAULT_CODES;
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { code } = req.body || {};
  const promoCode = String(code || "").trim().toUpperCase();

  if (!promoCode) {
    return res.status(400).json({ valid: false, message: "Promo code is required" });
  }

  const promoMap = resolvePromoMap();
  if (!Object.prototype.hasOwnProperty.call(promoMap, promoCode)) {
    return res.status(404).json({ valid: false, message: "Invalid promo code" });
  }

  return res.status(200).json({
    valid: true,
    discountPercent: promoMap[promoCode],
    message: "Promo validated",
  });
};
