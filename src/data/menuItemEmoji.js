/** Keyword / regex → emoji for menu cards (name + category). First match wins. */
const EMOJI_RULES = [
  [/pizza/i, "🍕"],
  [/pasta|alfredo|carbonara|spaghetti|lasagn|mac\s*&\s*cheese/i, "🍝"],
  [/burger/i, "🍔"],
  [/sandwich|sub\b|club/i, "🥪"],
  [/wrap|roll\b|kathi|frankie/i, "🌯"],
  [/biryani|biriyani/i, "🍛"],
  [/pulav|pulao|pilaf|fried\s*rice|jeera\s*rice|steamed\s*rice|veg\s*rice/i, "🍚"],
  [/rice\b/i, "🍚"],
  [/idli/i, "🥣"],
  [/dosa|uttapam/i, "🥞"],
  [/vada|vadai|bhaji|pakoda|pakora|bonda/i, "🧆"],
  [/sambar|rasam/i, "🥘"],
  [/chaat|pani\s*puri|gol\s*gappa|bhel|sev/i, "🥗"],
  [/momos?|dim\s*sum|dumpling/i, "🥟"],
  [/noodle|chow|manchurian|hakka|schezwan/i, "🍜"],
  [/soup/i, "🍲"],
  [/salad/i, "🥗"],
  [/curry|gravy|masala|korma|tikka\s*masala|butter\s*chicken/i, "🍛"],
  [/dal|daal|dhal|lentil/i, "🫘"],
  [/paneer/i, "🧀"],
  [/tikka|kebab|kabab|seekh|tandoor/i, "🍢"],
  [/roti|naan|paratha|kulcha|bhatura|puri|khamiri|chapati|phulka/i, "🫓"],
  [/thali|platter|combo/i, "🍱"],
  [/ice\s*cream|gelato|kulfi/i, "🍨"],
  [/cake|pastry|brownie|muffin/i, "🍰"],
  [/gulab|jalebi|halwa|ladoo|barfi|sweet|dessert/i, "🍮"],
  [/tea\b|chai|masala\s*chai/i, "🫖"],
  [/coffee|espresso|latte|cappuccino/i, "☕"],
  [/juice|lassi|shake|smoothie|mojito|cola|drink|soda/i, "🥤"],
  [/egg\b|anda/i, "🥚"],
  [/chicken|murg|murgh/i, "🍗"],
  [/mutton|lamb|gosht|keema/i, "🍖"],
  [/fish|prawn|shrimp|seafood|salmon/i, "🐟"],
  [/fries|finger|nugget|wings?/i, "🍟"],
  [/taco|burrito|nacho/i, "🌮"],
  [/sushi|sashimi/i, "🍣"],
  [/steak|bbq|grill/i, "🥩"],
  [/cheese\s*ball/i, "🧀"],
  [/cutlet|patty|croquette/i, "🧇"],
];

const VEG_FALLBACK = ["🌿", "🥬", "🍲", "🥘", "🫛", "🥙", "🍜", "🥣"];
const NONVEG_FALLBACK = ["🍖", "🍗", "🥩", "🦐", "🐟", "🍤", "🍢", "🥓"];

function hashPick(str, pool) {
  let h = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return pool[Math.abs(h) % pool.length];
}

/**
 * @param {string} name
 * @param {string} [categoryTitle]
 * @param {boolean} [isVeg]
 */
export function emojiForMenuItem(name, categoryTitle = "", isVeg = true) {
  const hay = `${name ?? ""} ${categoryTitle ?? ""}`;
  for (const [re, emoji] of EMOJI_RULES) {
    if (re.test(hay)) return emoji;
  }
  return hashPick(`${name}|${categoryTitle}`, isVeg ? VEG_FALLBACK : NONVEG_FALLBACK);
}
