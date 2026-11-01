// "Find your scent" quiz: three taps, matched against each perfume's notes,
// family, profile and occasion as written in the catalogue. New perfumes take
// part on their own once their notes are filled in.

// Words that give a perfume each tag, looked for in its notes, family,
// profile, occasion and description (its own name is removed first, so
// "Raat Mogra" or "Gulab Malai" do not count). The more of a tag's words a
// perfume has, the stronger that tag is for it, up to 3. Who a perfume is for
// (Admin → Catalogue → For) adds a men, women or unisex tag of strength 3.
const TAGS = {
  fresh: [/lemon|lime|citrus|bergamot|grapefruit|orange|mandarin/, /basil|rosemary|herb|green|apple/, /fresh|clean|cool|aqua|ozon|marine/],
  floral: [/rose|gulab/, /jasmine|mogra/, /magnolia|champa|neroli|blossom|flower|floral|lavender/],
  woody: [/oud|agarwood/, /leather/, /vetiver|khus|cedar|wood|sandal/],
  sweet: [/vanilla|cream|malai/, /cherry|raspberr|strawberr|peach|pineapple|fruit/, /\brum\b|sweet|gourmand/],
  spicy: [/saffron|kesar/, /cardamom|elaichi/, /cinnamon|dalchini|pepper|spic/],
  warm: [/vanilla|warm/, /musk/, /evening|night/],
  soft: [/musk/, /soft|powder|silk|skin|tender/, /sandal|cream/],
  day: [/every ?day|daytime|morning|office|college/],
  night: [/night|evening|date|party/],
  festive: [/wedding|festiv|celebrat|special occasion/],
};
const AUDIENCE_TAGS = { Men: "men", Women: "women", Unisex: "unisex" };

// `only`: who the perfume must be for (when the catalogue says).
export const QUESTIONS = [
  {
    id: "who",
    title: "Who is it for?",
    options: [
      { id: "him", emoji: "🤵", label: "For him", hint: "Bold and woody", only: ["Men", "Unisex"], weights: { men: 2 } },
      { id: "her", emoji: "💃", label: "For her", hint: "Soft and floral", only: ["Women", "Unisex"], weights: { women: 2 } },
      { id: "anyone", emoji: "✨", label: "For anyone", hint: "Unisex", weights: { unisex: 3 } },
      { id: "gift", emoji: "🎁", label: "A gift", hint: "Easy to love", weights: { unisex: 2, soft: 1 } },
    ],
  },
  {
    id: "when",
    title: "When will you wear it most?",
    options: [
      { id: "day", emoji: "☀️", label: "Office & college", hint: "Fresh all day", weights: { day: 3, fresh: 2 } },
      { id: "night", emoji: "🌙", label: "Evenings & dates", hint: "Warm, close to skin", weights: { night: 3, warm: 2 } },
      { id: "festive", emoji: "🪔", label: "Weddings & festivals", hint: "Rich and royal", weights: { festive: 4, woody: 1, spicy: 1 } },
      { id: "everyday", emoji: "🌿", label: "Every day", hint: "Soft and easy", weights: { soft: 2, day: 2 } },
    ],
  },
  {
    id: "pick",
    title: "Which one would you pick?",
    options: [
      { id: "flowers", emoji: "🌹", label: "Rose & jasmine", hint: "Flowers", weights: { floral: 3 } },
      { id: "woods", emoji: "🪵", label: "Oud & woods", hint: "Deep and smoky", weights: { woody: 3 } },
      { id: "sweet", emoji: "🍦", label: "Vanilla & fruit", hint: "Sweet and creamy", weights: { sweet: 3 } },
      { id: "spice", emoji: "🌶️", label: "Kesar & spice", hint: "Saffron, cardamom", weights: { spicy: 3 } },
    ],
  },
];

/** How strongly (1–3) a perfume has each tag, from its catalogue text. */
export function perfumeTags(product) {
  const name = String(product.name || "").toLowerCase();
  const text = [product.notes, product.fragrance_family, product.scent_profile, product.occasion, product.description]
    .filter(Boolean).join(" ").toLowerCase().split(name).join(" ");
  const tags = {};
  Object.entries(TAGS).forEach(([tag, words]) => {
    const hits = words.filter((word) => word.test(text)).length;
    if (hits) tags[tag] = Math.min(hits, 3);
  });
  const audience = AUDIENCE_TAGS[product.audience];
  if (audience) tags[audience] = 3;
  return tags;
}

/** The note names of a perfume, cleaned up for display. */
export function noteList(product) {
  return String(product.notes || "")
    .split(/[·,•|/]+/)
    .map((note) => note.trim())
    .filter(Boolean)
    .slice(0, 6);
}

/**
 * Perfumes ranked best match first for the chosen option ids (one per
 * question). Each perfume scores the answer weights times its tag strengths;
 * dividing by the square root of its total strength stops perfumes with long
 * note lists from winning every time. Ties keep catalogue order. An answer
 * with `only` leaves out perfumes for other people (if any is left).
 */
export function rankPerfumes(products, answers) {
  const weights = {};
  let pool = products;
  QUESTIONS.forEach((question, index) => {
    const option = question.options.find((candidate) => candidate.id === answers[index]);
    Object.entries(option?.weights || {}).forEach(([tag, weight]) => { weights[tag] = (weights[tag] || 0) + weight; });
    if (option?.only) {
      const narrowed = pool.filter((product) => !product.audience || option.only.includes(product.audience));
      if (narrowed.length) pool = narrowed;
    }
  });
  return pool
    .map((product, order) => {
      const tags = Object.entries(perfumeTags(product));
      const raw = tags.reduce((sum, [tag, strength]) => sum + (weights[tag] || 0) * strength, 0);
      const total = tags.reduce((sum, [, strength]) => sum + strength, 0);
      return { product, order, score: total ? raw / Math.sqrt(total) : 0 };
    })
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((entry) => entry.product);
}

// Short words for why a perfume matches the answers.
const REASON_LABELS = {
  fresh: "Fresh", floral: "Floral", woody: "Woody", sweet: "Sweet", spicy: "Spiced",
  warm: "Warm", soft: "Soft", day: "Daytime", night: "Evenings", festive: "Festive",
};

/**
 * Up to `limit` words saying why `product` suits the answers, strongest
 * first (e.g. ["Woody", "Spiced", "Evenings"]); its family when none fit.
 */
export function matchReasons(product, answers, limit = 3) {
  const weights = {};
  QUESTIONS.forEach((question, index) => {
    const option = question.options.find((candidate) => candidate.id === answers[index]);
    Object.entries(option?.weights || {}).forEach(([tag, weight]) => { weights[tag] = (weights[tag] || 0) + weight; });
  });
  const reasons = Object.entries(perfumeTags(product))
    .filter(([tag]) => REASON_LABELS[tag] && weights[tag])
    .sort((a, b) => weights[b[0]] * b[1] - weights[a[0]] * a[1])
    .slice(0, limit)
    .map(([tag]) => REASON_LABELS[tag]);
  if (reasons.length) return reasons;
  return product.fragrance_family ? [String(product.fragrance_family).split(/[·,/]/)[0].trim()].filter(Boolean) : [];
}

// Opening notes nearly every perfume shares: skipped when a note list has better ones.
const COMMON_OPENERS = /^(bergamot|mandarin)$/i;

/**
 * Up to `limit` of a perfume's own notes that fit the answers (e.g. oud and
 * leather for "Oud & woods"), so similar matches can be told apart; its
 * first distinctive notes when none fit.
 */
export function matchNotes(product, answers, limit = 3) {
  const weights = {};
  QUESTIONS.forEach((question, index) => {
    const option = question.options.find((candidate) => candidate.id === answers[index]);
    Object.entries(option?.weights || {}).forEach(([tag, weight]) => { weights[tag] = (weights[tag] || 0) + weight; });
  });
  const notes = String(product.notes || "").split(/[·,•|/]+/).map((note) => note.trim()).filter(Boolean);
  const scored = notes.map((note, order) => {
    const text = note.toLowerCase();
    const score = Object.entries(TAGS).reduce((sum, [tag, words]) => sum + (weights[tag] && words.some((word) => word.test(text)) ? weights[tag] : 0), 0);
    return { note, order, score };
  });
  const fitting = scored.filter((entry) => entry.score > 0 && !COMMON_OPENERS.test(entry.note));
  const chosen = (fitting.length ? fitting.sort((a, b) => b.score - a.score || a.order - b.order) : scored.filter((entry) => !COMMON_OPENERS.test(entry.note)))
    .slice(0, limit)
    .sort((a, b) => a.order - b.order)
    .map((entry) => entry.note.replace(/\s*\([^)]*\)/, ""));
  return chosen;
}
