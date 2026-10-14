// "Find your scent" quiz: three taps, matched against each perfume's notes,
// family, profile and occasion as written in the catalogue. New perfumes take
// part on their own once their notes are filled in.

// Words that give a perfume each tag, looked for in its notes, family,
// profile, occasion and description (its own name is removed first, so
// "Night Queen" or "Lemon Breeze" do not count). The more of a tag's words a
// perfume has, the stronger that tag is for it, up to 3.
const TAGS = {
  citrus: [/lemon/, /lime/, /citrus/, /orange/, /bergamot/, /grapefruit/, /zest/],
  apple: [/(^|[^a-z])apple/], // green apple, not pineapple
  tropical: [/pin?e?apple/, /peach/, /melon/, /mango/, /tropical/, /coconut/, /l[iy]t?chee|litchi/],
  aquatic: [/aqua/, /water/, /ozon/, /marine/],
  herbal: [/\bherb/, /\bspic/, /\bmint\b/, /\btea\b/, /basil/],
  soft: [/musk/, /floral|flower/, /rose/, /jasmine/, /vanilla/, /amber/, /wood|oud|sandal/],
  day: [/every ?day/, /daytime/, /morning/, /office/, /college/],
  active: [/\bgym\b/, /travel/, /sport/, /outdoor/],
  holiday: [/holiday/, /summer/, /beach/, /vacation/],
  night: [/night/, /evening/, /party/],
};

export const QUESTIONS = [
  {
    id: "when",
    title: "When will you wear it most?",
    options: [
      { id: "day", emoji: "☀️", label: "College & office", hint: "Fresh all day", weights: { day: 2, citrus: 1, herbal: 1 } },
      { id: "active", emoji: "🏃", label: "Gym & travel", hint: "Light, on the go", weights: { active: 3, aquatic: 2 } },
      { id: "holiday", emoji: "🌴", label: "Weekends & trips", hint: "Sunny and playful", weights: { holiday: 2, tropical: 2 } },
      { id: "night", emoji: "🌙", label: "Evenings & garba", hint: "Soft, close to skin", weights: { night: 2, soft: 2 } },
    ],
  },
  {
    id: "vibe",
    title: "Pick a vibe",
    options: [
      { id: "zesty", emoji: "✨", label: "Zesty & sparkling", hint: "Bright citrus", weights: { citrus: 3 } },
      { id: "juicy", emoji: "🍑", label: "Juicy & tropical", hint: "Sweet fruit", weights: { tropical: 3 } },
      { id: "clean", emoji: "💧", label: "Cool & clean", hint: "Fresh water", weights: { aquatic: 3, apple: 1 } },
      { id: "soft", emoji: "🌸", label: "Soft & musky", hint: "Warm and gentle", weights: { soft: 4 } },
    ],
  },
  {
    id: "pick",
    title: "Which one would you pick?",
    options: [
      { id: "lemon", emoji: "🍋", label: "Lemon", hint: "Sharp and sunny", weights: { citrus: 2 } },
      { id: "apple", emoji: "🍏", label: "Green apple", hint: "Crisp and green", weights: { apple: 3 } },
      { id: "pineapple", emoji: "🍍", label: "Pineapple", hint: "Juicy and sweet", weights: { tropical: 2 } },
      { id: "flowers", emoji: "🌸", label: "Flowers", hint: "No fruit for me", weights: { soft: 2 } },
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
 * note lists from winning every time. Ties keep catalogue order.
 */
export function rankPerfumes(products, answers) {
  const weights = {};
  QUESTIONS.forEach((question, index) => {
    const option = question.options.find((candidate) => candidate.id === answers[index]);
    Object.entries(option?.weights || {}).forEach(([tag, weight]) => { weights[tag] = (weights[tag] || 0) + weight; });
  });
  return products
    .map((product, order) => {
      const tags = Object.entries(perfumeTags(product));
      const raw = tags.reduce((sum, [tag, strength]) => sum + (weights[tag] || 0) * strength, 0);
      const total = tags.reduce((sum, [, strength]) => sum + strength, 0);
      return { product, order, score: total ? raw / Math.sqrt(total) : 0 };
    })
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((entry) => entry.product);
}
