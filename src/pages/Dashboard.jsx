import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHero from "../components/DashboardHero";
import DashboardInsights from "../components/DashboardInsights";
import DashboardSalesPanel from "../components/DashboardSalesPanel";
import { fetchDashboardStats } from "../services/queries";

const DASHBOARD_POLL_MS = 15_000;

function formatInr(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDatePill() {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

function formatLastUpdated(date) {
  if (!date) return "";
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 12) return "Updated just now";
  if (sec < 60) return `Updated ${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `Updated ${min}m ago`;
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function TrendBadge({ pct, fallback, live = false }) {
  if (pct == null || Number.isNaN(pct)) {
    return (
      <span
        className={`summary-badge ${live ? "summary-badge--live" : "summary-badge--neutral"}`}
      >
        {fallback}
      </span>
    );
  }
  if (pct === 0) {
    return (
      <span className="summary-badge summary-badge--neutral">→ vs yesterday</span>
    );
  }
  const up = pct > 0;
  return (
    <span
      className={`summary-badge ${up ? "summary-badge--green" : "summary-badge--red"}`}
    >
      {up ? "↑" : "↓"} {Math.abs(pct)}% vs yesterday
    </span>
  );
}

function IconBill() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
      <path d="M3 6h18M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconUtensils() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 2v7c0 1.66 1 3 3 3h0M16 8V2M8 2v20M16 2v20l-2-2-2 2" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

const STAFFING_CHECKLIST = [
  "Add one extra cook on tandoor or main line from 7:45 PM.",
  "Pre-batch rice, dal, and breads before 8:00 PM where possible.",
  "Confirm at least two delivery riders on standby for 8–10 PM.",
  "Brief counter staff on estimated wait times during the spike.",
];

function StaffingRushModal({ onClose, onViewOrders, onViewSupport }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="order-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staffing-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="order-modal-header">
          <div>
            <h2 id="staffing-modal-title" className="order-modal-title">
              Rush-hour staffing
            </h2>
            <p className="order-modal-id">Tonight · 8:00 PM – 10:00 PM</p>
          </div>
          <button
            type="button"
            className="order-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <IconX />
          </button>
        </div>

        <div className="order-modal-body">
          <div className="order-modal-section">
            <p className="staffing-modal-lede">
              Use this checklist before the evening rush. Adjust headcount to match
              your real covers and delivery load.
            </p>
          </div>
          <div className="order-modal-section">
            <h3>Prep &amp; floor</h3>
            <ul className="staffing-checklist">
              {STAFFING_CHECKLIST.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="order-modal-footer">
          <button type="button" className="btn btn-primary" onClick={onViewOrders}>
            Open Live Orders
          </button>
          <button type="button" className="btn btn-ghost" onClick={onViewSupport}>
            Runbook &amp; contacts
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffingModalOpen, setStaffingModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [, setTick] = useState(0);

  const closeStaffingModal = useCallback(() => setStaffingModalOpen(false), []);

  const goToLiveOrders = useCallback(() => {
    setStaffingModalOpen(false);
    navigate("/orders");
  }, [navigate]);

  const goToSupportRunbook = useCallback(() => {
    setStaffingModalOpen(false);
    navigate("/support");
  }, [navigate]);

  const viewRushDetails = useCallback(() => {
    navigate("/orders");
  }, [navigate]);

  useEffect(() => {
    const tickId = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(tickId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load(silent) {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const { stats: next, error: qErr } = await fetchDashboardStats();
      if (cancelled) return;
      if (qErr) {
        setError(qErr.message);
        if (!silent) setStats(null);
      } else {
        setStats(next);
        setLastUpdated(new Date());
      }
      if (!silent) setLoading(false);
    }

    load(false);
    const pollId = setInterval(() => load(true), DASHBOARD_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(pollId);
    };
  }, []);

  /** Progress bar widths (meaningful vs decorative caps). */
  const barWidths = useMemo(() => {
    if (!stats) return { revenue: 0, orders: 0, todayRevenue: 0, todayOrders: 0 };
    const revRef = 100_000;
    const revenue = Math.min(100, Math.round((stats.revenue / revRef) * 100));
    const orders = Math.min(100, stats.capacityPct);
    let todayRevenue = 0;
    let todayOrders = 0;
    if (stats.hasDailyBreakdown) {
      if (stats.revenue > 0) {
        todayRevenue = Math.min(
          100,
          Math.round((stats.todayRevenue / stats.revenue) * 100)
        );
      }
      if (stats.orderCount > 0) {
        todayOrders = Math.min(
          100,
          Math.round((stats.todayOrderCount / stats.orderCount) * 100)
        );
      }
    }
    return { revenue, orders, todayRevenue, todayOrders };
  }, [stats]);

  return (
    <>
      <header className={`page-head page-head--${stats?.kitchenLoad ?? "light"}`}>
        <div className="page-head-text">
          <h1 className="page-title">Overview Dashboard</h1>
          <p className="page-subtitle">
            Live kitchen and sales snapshot for Maa Jaanki Restaurant.
          </p>
        </div>
        <div className="page-head-actions">
          <div className="page-date-pill page-date-pill--live">
            <span className="live-dot" aria-hidden="true" />
            <IconCalendar />
            {formatDatePill()}
          </div>
          {lastUpdated && !loading && (
            <p className="page-last-updated">{formatLastUpdated(lastUpdated)}</p>
          )}
        </div>
      </header>

      {loading && (
        <div className="ds-skeleton-grid" aria-busy="true" aria-label="Loading dashboard">
          <div className="ds-skeleton-block" />
          <div className="ds-skeleton-block" />
          <div className="ds-skeleton-block" />
          <div className="ds-skeleton-block" />
        </div>
      )}

      {error && (
        <p className="ds-error" role="alert">
          {error}. Grant <code>SELECT</code> on <code>orders</code> and{" "}
          <code>order_items</code> for the anon role if RLS is enabled.
        </p>
      )}

      {!loading && stats && (
        <>
          <DashboardHero stats={stats} />

          <div className="summary-grid summary-grid--animate">
            <article className="summary-card summary-card--accent-cyan">
              <div className="summary-card-top">
                <div className="summary-card-icon" aria-hidden="true">
                  <IconBill />
                </div>
                <TrendBadge
                  pct={null}
                  fallback={`${stats.ordersWithDiscount} discounted`}
                />
              </div>
              <p className="summary-card-kicker">Total collected</p>
              <p className="summary-card-value">{formatInr(stats.revenue)}</p>
              <p className="summary-card-meta">
                {stats.discountsGiven > 0 ? (
                  <>
                    <span className="summary-stat-pair">
                      <span>Subtotal</span>
                      <span>{formatInr(stats.grossSubtotal)}</span>
                    </span>
                    <span className="summary-stat-pair summary-stat-pair--discount">
                      <span>Discount</span>
                      <span>−{formatInr(stats.discountsGiven)}</span>
                    </span>
                  </>
                ) : (
                  <>Gross {formatInr(stats.grossSubtotal)} · no discounts applied</>
                )}
              </p>
              <div className="summary-progress" aria-hidden="true">
                <div
                  className="summary-progress-fill summary-progress-fill--cyan"
                  style={{ width: `${barWidths.revenue}%` }}
                />
              </div>
            </article>

            <article className="summary-card summary-card--accent-purple">
              <div className="summary-card-top">
                <div className="summary-card-icon summary-card-icon--purple" aria-hidden="true">
                  <IconBag />
                </div>
                <span className="summary-badge summary-badge--neutral">
                  {stats.customerCount} customers
                </span>
              </div>
              <p className="summary-card-kicker">Total orders</p>
              <p className="summary-card-value">
                {stats.orderCount.toLocaleString("en-IN")}
              </p>
              <div className="summary-progress" aria-hidden="true">
                <div
                  className="summary-progress-fill summary-progress-fill--purple"
                  style={{ width: `${barWidths.orders}%` }}
                />
              </div>
            </article>

            <article className="summary-card summary-card--accent-cyan summary-card--live summary-card--with-meta">
              <div className="summary-card-top">
                <div className="summary-card-icon" aria-hidden="true">
                  <IconCalendar />
                </div>
                <TrendBadge
                  pct={stats.hasDailyBreakdown ? stats.revenueTrendPct : null}
                  fallback="LIVE"
                  live
                />
              </div>
              <p className="summary-card-kicker">Today&apos;s revenue</p>
              <p className="summary-card-value summary-card-value--cyan">
                {stats.hasDailyBreakdown
                  ? formatInr(stats.todayRevenue)
                  : "—"}
              </p>
              <p className="summary-card-meta">
                {stats.hasDailyBreakdown ? (
                  stats.todayDiscounts > 0 ? (
                    <>
                      <span className="summary-stat-pair">
                        <span>Subtotal</span>
                        <span>{formatInr(stats.todayGrossSubtotal)}</span>
                      </span>
                      <span className="summary-stat-pair summary-stat-pair--discount">
                        <span>Discount</span>
                        <span>−{formatInr(stats.todayDiscounts)}</span>
                      </span>
                    </>
                  ) : (
                    `Gross ${formatInr(stats.todayGrossSubtotal)} · no discounts today`
                  )
                ) : (
                  "Add placed_at or created_at on orders for daily totals"
                )}
              </p>
              <div className="summary-progress" aria-hidden="true">
                <div
                  className="summary-progress-fill summary-progress-fill--cyan"
                  style={{
                    width: stats.hasDailyBreakdown ? `${barWidths.todayRevenue}%` : "0%",
                  }}
                />
              </div>
            </article>

            <article className="summary-card summary-card--accent-amber">
              <div className="summary-card-top">
                <div className="summary-card-icon summary-card-icon--warm" aria-hidden="true">
                  <IconUtensils />
                </div>
                <TrendBadge
                  pct={stats.hasDailyBreakdown ? stats.ordersTrendPct : null}
                  fallback={`${stats.capacityPct}% load`}
                />
              </div>
              <p className="summary-card-kicker">Today&apos;s orders</p>
              <p className="summary-card-value summary-card-value--warm">
                {stats.hasDailyBreakdown
                  ? stats.todayOrderCount.toLocaleString("en-IN")
                  : "—"}
              </p>
              {stats.hasDailyBreakdown ? (
                <p className="summary-card-meta summary-card-meta--inline">
                  Today vs all orders in your dataset
                </p>
              ) : (
                <div
                  className="summary-card-meta-spacer"
                  aria-hidden="true"
                />
              )}
              <div className="summary-progress" aria-hidden="true">
                <div
                  className="summary-progress-fill summary-progress-fill--amber"
                  style={{
                    width: stats.hasDailyBreakdown ? `${barWidths.todayOrders}%` : "0%",
                  }}
                />
              </div>
            </article>
          </div>

          <DashboardInsights stats={stats} />

          <DashboardSalesPanel stats={stats} />

          {stats.showRushBanner && (
          <section className="prediction-banner" aria-labelledby="prediction-heading">
            <div className="prediction-banner-bg" aria-hidden="true" />
            <div className="prediction-banner-layout">
              <div className="prediction-banner-inner">
                <p className="prediction-banner-eyebrow">Service planning</p>
                <h2 id="prediction-heading">
                  Evening rush: expect high volume
                </h2>
                <p className="prediction-banner-lede">
                  Roughly a fifth more tickets than average between 8:00 PM and
                  10:00 PM. Line up prep and riders before the spike.
                </p>
                <div className="prediction-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setStaffingModalOpen(true)}
                  >
                    <IconBolt />
                    Optimize staffing
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={viewRushDetails}
                  >
                    View details
                  </button>
                </div>
              </div>
              <aside className="prediction-window-card" aria-label="Peak service window">
                <div className="prediction-window-icon" aria-hidden="true">
                  <IconClock />
                </div>
                <p className="prediction-window-label">Peak window</p>
                <p className="prediction-window-time">8:00 PM – 10:00 PM</p>
                <p className="prediction-window-hint">
                  Highest order volume expected
                </p>
              </aside>
            </div>
          </section>
          )}

          {staffingModalOpen && (
            <StaffingRushModal
              onClose={closeStaffingModal}
              onViewOrders={goToLiveOrders}
              onViewSupport={goToSupportRunbook}
            />
          )}
        </>
      )}
    </>
  );
}
