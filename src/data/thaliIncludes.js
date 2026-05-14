/**
 * Printed-menu inclusions for Thali dishes (shown when the Supabase item name matches).
 * Prices still come from `menu_items.price` in the database.
 */
const THALI_RULES = [
  {
    /* Only the actual thali — not "Jaanki Special Noodles", "Fried Rice", etc. */
    test: (name) => /jaanki\s+special\s+thali/i.test(name ?? ""),
    lines: [
      "Kaju Masala",
      "Paneer Gravy",
      "Dal Makhni",
      "Mix Veg",
      "Kashmiri Pulav",
      "1 Lacchha Paratha",
      "1 Stuffed Naan",
      "1 Missi Roti",
      "Shahi Tukda / Gulab Jamun",
    ],
  },
  {
    test: (name) => /deluxe\s+thali/i.test(name ?? ""),
    lines: [
      "Paneer Gravy",
      "Dal Fry",
      "Mix Veg",
      "Jeera Rice",
      "1 Lacchha Paratha",
      "1 Butter Naan",
      "Gulab Jamun",
    ],
  },
];

/** @param {string | null | undefined} name */
export function getThaliIncludesLines(name) {
  for (const rule of THALI_RULES) {
    if (rule.test(name)) return rule.lines;
  }
  return null;
}
