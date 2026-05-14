import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getThaliIncludesLines } from "../data/thaliIncludes";
import { emojiForMenuItem } from "../data/menuItemEmoji";
import { fetchMenuCategories, fetchMenuItems } from "../services/queries";

function formatInr(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function itemMatchesMenuSearch(item, qRaw) {
  const q = qRaw.trim().toLowerCase();
  if (!q) return true;
  if ((item.name ?? "").toLowerCase().includes(q)) return true;
  if (String(item.price ?? "").includes(q)) return true;
  if (String(item.id ?? "").toLowerCase().includes(q)) return true;
  if (item.veg && (q === "veg" || q === "vegetarian" || q === "v")) return true;
  if (!item.veg && (q === "non-veg" || q === "nonveg" || q === "non")) return true;
  const thaliLines = getThaliIncludesLines(item.name);
  if (thaliLines?.some((line) => line.toLowerCase().includes(q))) return true;
  return false;
}

function itemVisibleInSearch(item, categories, qRaw) {
  const q = qRaw.trim().toLowerCase();
  if (!q) return true;
  if (itemMatchesMenuSearch(item, qRaw)) return true;
  const cat = categories.find((c) => c.id === item.category_id);
  if (cat && (cat.title ?? "").toLowerCase().includes(q)) return true;
  return false;
}

export default function Menu() {
  const { menuSearch = "" } = useOutletContext() ?? {};
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterId, setFilterId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const [catRes, itemRes] = await Promise.all([
        fetchMenuCategories(),
        fetchMenuItems(),
      ]);
      if (cancelled) return;
      const err = catRes.error || itemRes.error;
      if (err) {
        setError(err.message);
        setCategories([]);
        setItems([]);
      } else {
        setCategories(catRes.data ?? []);
        setItems(itemRes.data ?? []);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleItems = useMemo(
    () => items.filter((item) => itemVisibleInSearch(item, categories, menuSearch)),
    [items, categories, menuSearch]
  );

  const itemsByCategory = useMemo(() => {
    const map = new Map();
    for (const c of categories) {
      map.set(c.id, []);
    }
    for (const item of visibleItems) {
      const list = map.get(item.category_id);
      if (list) list.push(item);
    }
    return map;
  }, [categories, visibleItems]);

  const visibleCategories = useMemo(() => {
    const base =
      filterId == null
        ? categories
        : categories.filter((c) => c.id === filterId);
    const q = menuSearch.trim();
    if (filterId != null) return base;
    if (!q) return base;
    return base.filter((c) => (itemsByCategory.get(c.id) ?? []).length > 0);
  }, [categories, filterId, itemsByCategory, menuSearch]);

  const searchActive = menuSearch.trim().length > 0;
  const noMatches =
    !loading &&
    !error &&
    categories.length > 0 &&
    searchActive &&
    visibleItems.length === 0;

  return (
    <>
      <header className="page-head">
        <div className="page-head-text">
          <h1 className="page-title">Menu Manager</h1>
          <p className="page-subtitle">
            Your live menu at a glance—organised by section, with clear veg and
            non-veg markers. Use the search bar to jump to a dish, price, category,
            or dietary preference in seconds.
          </p>
        </div>
      </header>

      <div className="menu-toolbar">
        <div className="category-pills" role="tablist" aria-label="Category filter">
          <button
            type="button"
            role="tab"
            aria-selected={filterId == null}
            className={`category-pill${filterId == null ? " category-pill--active" : ""}`}
            onClick={() => setFilterId(null)}
          >
            All items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={filterId === cat.id}
              className={`category-pill${filterId === cat.id ? " category-pill--active" : ""}`}
              onClick={() => setFilterId(cat.id)}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="ds-hint">Loading menu from Supabase…</p>}
      {error && (
        <p className="ds-error" role="alert">
          {error}. Check Row Level Security (anon needs <code>SELECT</code> on{" "}
          <code>menu_categories</code> and <code>menu_items</code>).
        </p>
      )}

      {noMatches && (
        <p className="ds-hint" role="status">
          No menu items match &quot;{menuSearch.trim()}&quot;. Clear the search to
          see everything.
        </p>
      )}

      {!loading && !error && categories.length === 0 && (
        <p className="ds-hint">No categories found.</p>
      )}

      {!loading &&
        !error &&
        visibleCategories.map((cat) => {
          const catItems = itemsByCategory.get(cat.id) ?? [];
          return (
            <section
              key={cat.id}
              className="menu-section-block"
              aria-labelledby={`cat-${cat.id}`}
            >
              <div className="menu-section-head">
                <h2 className="menu-section-title" id={`cat-${cat.id}`}>
                  {cat.title}
                </h2>
                <span className="menu-count-badge">
                  {catItems.length} items
                </span>
              </div>

              {catItems.length === 0 ? (
                <p className="ds-hint menu-card-grid-empty">
                  {searchActive
                    ? "No items match this search in this category."
                    : "No active items in this category."}
                </p>
              ) : (
                <div className="menu-card-grid">
                  {catItems.map((item) => {
                    const thaliLines = getThaliIncludesLines(item.name);
                    const dishEmoji = emojiForMenuItem(
                      item.name,
                      cat.title,
                      item.veg
                    );
                    return (
                    <article
                      key={item.id}
                      className={`menu-card-v2${item.veg ? " menu-card-v2--veg" : " menu-card-v2--nonveg"}`}
                    >
                      <span className="menu-card-v2__shine" aria-hidden="true" />
                      <span className="menu-card-v2__glow" aria-hidden="true" />
                      <header className="menu-card-v2__top">
                        <span className="menu-card-v2__emoji-wrap" aria-hidden="true">
                          <span className="menu-card-v2__emoji">{dishEmoji}</span>
                        </span>
                        <span className="menu-card-v2__badge">
                          {item.veg ? "Veg" : "Non-veg"}
                        </span>
                      </header>
                      <div className="menu-card-v2__main">
                        <h3 className="menu-card-v2__title">{item.name}</h3>
                        {thaliLines && thaliLines.length > 0 ? (
                          <ul className="menu-card-v2__includes" aria-label="Included in this thali">
                            {thaliLines.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                      <footer className="menu-card-v2__footer">
                        <span className="menu-card-v2__sparkle" aria-hidden="true">
                          ✨
                        </span>
                        <span className="menu-card-v2__price">{formatInr(item.price)}</span>
                      </footer>
                    </article>
                  );
                  })}
                </div>
              )}
            </section>
          );
        })}
    </>
  );
}
