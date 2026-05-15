import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../auth";

function IconDashboard(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconOrders(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

function IconMenu(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 002-2V2M7 2v20" />
      <path d="M21 3v7a5 5 0 01-10 0V3" />
      <path d="M16 3v18" />
    </svg>
  );
}

function IconSettings(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function IconSupport(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 018.5-8.5h.5a8.5 8.5 0 018 5.5" />
    </svg>
  );
}

function IconSearch(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function IconHamburger(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function IconCloseNav(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

const searchPlaceholders = {
  "/orders": "Search orders, customers, or items…",
  "/menu": "Search menu items…",
  "/settings": "Search preferences…",
  "/support": "Search for help articles, FAQs…",
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [ordersSearch, setOrdersSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [settingsSearch, setSettingsSearch] = useState("");
  const [supportSearch, setSupportSearch] = useState("");
  const isOrdersRoute = pathname === "/orders";
  const isMenuRoute = pathname === "/menu";
  const isSettingsRoute = pathname === "/settings";
  const isSupportRoute = pathname === "/support";
  const isDashboard = pathname === "/";

  useEffect(() => {
    if (!isOrdersRoute) setOrdersSearch("");
  }, [isOrdersRoute]);

  useEffect(() => {
    if (!isMenuRoute) setMenuSearch("");
  }, [isMenuRoute]);

  useEffect(() => {
    if (!isSettingsRoute) setSettingsSearch("");
  }, [isSettingsRoute]);

  useEffect(() => {
    if (!isSupportRoute) setSupportSearch("");
  }, [isSupportRoute]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    function onKey(e) {
      if (e.key === "Escape") setNavOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  useEffect(() => {
    if (navOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  const closeNav = () => setNavOpen(false);

  const placeholder =
    searchPlaceholders[pathname] ?? searchPlaceholders["/orders"];

  const outletContext = useMemo(
    () => ({
      ordersSearch,
      setOrdersSearch,
      menuSearch,
      setMenuSearch,
      settingsSearch,
      setSettingsSearch,
      supportSearch,
      setSupportSearch,
    }),
    [ordersSearch, menuSearch, settingsSearch, supportSearch]
  );

  const navClass = ({ isActive }) =>
    `admin-nav-link${isActive ? " admin-nav-link--active" : ""}`;

  return (
    <div className={`admin-root${navOpen ? " admin-root--nav-open" : ""}`}>
      <button
        type="button"
        className="admin-nav-backdrop"
        aria-label="Close navigation menu"
        tabIndex={navOpen ? 0 : -1}
        aria-hidden={!navOpen}
        onClick={closeNav}
      />

      <aside
        className={`admin-sidebar${navOpen ? " admin-sidebar--open" : ""}`}
        aria-label="Main navigation"
      >
        <button
          type="button"
          className="admin-sidebar-close"
          aria-label="Close menu"
          onClick={closeNav}
        >
          <IconCloseNav />
        </button>

        <div className="admin-sidebar-brand">
          <p className="admin-sidebar-logo">Maa Jaanki</p>
          <span className="admin-sidebar-tag">Admin Console</span>
        </div>

        <nav className="admin-nav" aria-label="Primary">
          <NavLink to="/" end className={navClass} onClick={closeNav}>
            <IconDashboard />
            Dashboard
          </NavLink>
          <NavLink to="/orders" className={navClass} onClick={closeNav}>
            <IconOrders />
            Live Orders
          </NavLink>
          <NavLink to="/menu" className={navClass} onClick={closeNav}>
            <IconMenu />
            Menu Manager
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-status-pill">
            <span className="admin-status-dot" aria-hidden="true" />
            System Status: Online
          </div>
          <NavLink to="/settings" className={navClass} onClick={closeNav}>
            <IconSettings />
            Settings
          </NavLink>
          <NavLink to="/support" className={navClass} onClick={closeNav}>
            <IconSupport />
            Support
          </NavLink>
          <button
            type="button"
            className="admin-nav-link"
            onClick={() => {
              closeNav();
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="admin-canvas">
        <header
          className={`admin-topbar${isDashboard ? " admin-topbar--dashboard" : ""}`}
        >
          <button
            type="button"
            className="admin-menu-btn"
            aria-label="Open navigation menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
          >
            <IconHamburger />
          </button>

          {isDashboard ? (
            <div className="admin-topbar-spacer" aria-hidden="true" />
          ) : (
            <label className="admin-search" htmlFor="admin-global-search">
              <IconSearch aria-hidden="true" />
              <input
                id="admin-global-search"
                type="search"
                placeholder={placeholder}
                autoComplete="off"
                value={
                  isOrdersRoute
                    ? ordersSearch
                    : isMenuRoute
                      ? menuSearch
                      : isSettingsRoute
                        ? settingsSearch
                        : isSupportRoute
                          ? supportSearch
                          : ""
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (isOrdersRoute) setOrdersSearch(v);
                  else if (isMenuRoute) setMenuSearch(v);
                  else if (isSettingsRoute) setSettingsSearch(v);
                  else if (isSupportRoute) setSupportSearch(v);
                }}
                aria-label={placeholder}
              />
            </label>
          )}

          <div className="admin-topbar-actions">
            {pathname === "/orders" && (
              <div className="admin-toggle-row">
                <span>Auto-assign Delivery</span>
                <button
                  type="button"
                  className="admin-toggle admin-toggle--on"
                  aria-pressed="true"
                  aria-label="Auto-assign delivery on"
                >
                  <span className="admin-toggle-knob" />
                </button>
              </div>
            )}

            <div className="admin-user">
              <div className="admin-user-text">
                <span className="admin-user-name">Maa Jaanki</span>
                <span className="admin-user-role">
                  {pathname === "/settings"
                    ? "General Manager"
                    : pathname === "/support"
                      ? "Admin Panel"
                      : "Super Admin"}
                </span>
              </div>
              <div className="admin-avatar" aria-hidden="true">
                MJ
              </div>
            </div>
          </div>
        </header>

        <main className="admin-main">
          <div className="admin-main-inner">
            <Outlet context={outletContext} />
          </div>
        </main>
      </div>
    </div>
  );
}
