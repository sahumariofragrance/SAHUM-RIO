// Each perfume's name written in Gujarati script, shown as a small accent
// under the English name. Add a line here when a new perfume is added; a
// perfume without one simply shows its English name alone.
const GUJARATI_NAMES = {
  bloom: "બ્લૂમ",
  "dew-drop": "ડ્યૂ ડ્રોપ",
  "lemon-breeze": "લેમન બ્રીઝ",
  "morning-dew": "મોર્નિંગ ડ્યૂ",
  "night-queen": "નાઇટ ક્વીન",
  blix: "બ્લિક્સ",
};

export function gujaratiName(slug) {
  return GUJARATI_NAMES[slug] || null;
}

// "Fragrance, from Gujarat"
export const GUJARATI_TAGLINE = "ખુશ્બૂ, ગુજરાતથી";
