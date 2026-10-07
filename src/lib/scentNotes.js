// Turns a perfume's notes text (as typed in the catalogue, e.g.
// "Lemon · Green Apple, Aqua Accord") into known notes with an icon, colour
// and a few words, plus a simple "character" profile built from them.
// Unknown notes are still shown, with a neutral icon and no character.

// Order matters: more specific words first ("pineapple" before "apple").
// keepName: show the name as written instead of the label.
const NOTES = [
  { key: "pineapple", match: ["pineapple", "pinapple"], label: "Pineapple", words: "Tropical, juicy", color: "#D19A12", icon: "pineapple", accords: { fruity: 3, sweet: 1 } },
  { key: "apple", match: ["green apple", "apple"], label: "Green Apple", words: "Crisp, green", color: "#5E9E32", icon: "apple", accords: { fruity: 2, green: 2, fresh: 1 } },
  { key: "lemon", match: ["lemon", "lemone"], label: "Lemon", words: "Zesty, bright", color: "#D4A90C", icon: "lemon", accords: { citrus: 3, fresh: 1 } },
  { key: "lime", match: ["lime"], label: "Lime", words: "Sharp, sparkling", color: "#6FA52B", icon: "wheel", accords: { citrus: 3, fresh: 1 } },
  { key: "orange", match: ["orange", "mandarin"], label: "Orange", words: "Juicy, sunny", color: "#E57C1A", icon: "orange", accords: { citrus: 2, fruity: 1, sweet: 1 } },
  { key: "citrus", match: ["citrus", "bergamot"], label: "Citrus", words: "Clean, sunny", color: "#E09A1E", icon: "wheel", accords: { citrus: 3 } },
  { key: "peach", match: ["peach"], label: "Peach", words: "Soft, velvety", color: "#E3875E", icon: "peach", accords: { fruity: 2, sweet: 2 } },
  { key: "melon", match: ["melon"], label: "Melon", words: "Cool, watery", color: "#5FAE77", icon: "melon", accords: { fruity: 2, fresh: 1, aquatic: 1 } },
  { key: "aqua", match: ["aqua", "aquatic", "marine", "sea"], label: "Aqua", words: "Cool, marine", color: "#3A93BC", icon: "wave", accords: { aquatic: 3, fresh: 2 } },
  { key: "ozone", match: ["ozone", "ozonic"], label: "Ozone", words: "Airy, open", color: "#6E93BC", icon: "air", accords: { fresh: 2, aquatic: 2 } },
  { key: "herbal", keepName: true, match: ["herbal", "herb", "basil", "mint"], label: "Herbs", words: "Green, aromatic", color: "#4F8A43", icon: "leaf", accords: { herbal: 3, green: 1 } },
  { key: "spice", keepName: true, match: ["spice", "spicy", "pepper", "cardamom"], label: "Spice", words: "Warm, gentle", color: "#B0582E", icon: "spice", accords: { spicy: 3 } },
  { key: "musk", keepName: true, match: ["musk"], label: "Musk", words: "Soft, skin-like", color: "#A6896E", icon: "musk", accords: { musky: 3 } },
  { key: "floral", keepName: true, match: ["floral", "flower", "jasmine", "rose", "lily", "tuberose"], label: "Floral", words: "Soft, petal-like", color: "#D4668F", icon: "flower", accords: { floral: 3 } },
  { key: "fresh", match: ["fresh"], label: "Fresh", words: "Clean, airy", color: "#4FA0B0", icon: "sparkle", accords: { fresh: 3 } },
];

export const ACCORD_LABELS = {
  citrus: "Citrus", fruity: "Fruity", fresh: "Fresh", aquatic: "Aquatic", green: "Green",
  herbal: "Herbal", spicy: "Spicy", sweet: "Sweet", floral: "Floral", musky: "Musky",
};

function titleCase(text) {
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Known and unknown notes, in the order they were written, without repeats. */
export function parseNotes(text) {
  const parts = String(text || "")
    .split(/[,·•;|/\n]|\band\b|&/i)
    .map((part) => part.replace(/\(.*?\)/g, " ").replace(/\b(notes?|accord)\b/gi, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const seen = new Set();
  const notes = [];
  parts.forEach((part) => {
    const lower = part.toLowerCase();
    const known = NOTES.find((note) => note.match.some((word) => lower.includes(word)));
    const key = known ? known.key : lower;
    if (seen.has(key)) return;
    seen.add(key);
    if (!known) notes.push({ key, label: titleCase(part), words: "", color: "#8A8176", icon: "drop", accords: {} });
    // Fruits use one fixed name (which also fixes typos); for herbs, spices,
    // musks and flowers the written name ("Jasmine") says more.
    else notes.push(known.keepName ? { ...known, label: titleCase(part) } : known);
  });
  return notes;
}

/** The strongest accords, each scored 1–5 relative to the strongest. */
export function characterOf(notes, limit = 4) {
  const totals = {};
  notes.forEach((note) => Object.entries(note.accords).forEach(([accord, weight]) => {
    totals[accord] = (totals[accord] || 0) + weight;
  }));
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, limit);
  const top = sorted[0]?.[1] || 0;
  return sorted.map(([accord, total]) => ({ accord, label: ACCORD_LABELS[accord], level: Math.max(1, Math.round((total / top) * 5)) }));
}
