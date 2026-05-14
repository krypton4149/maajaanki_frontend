import { useEffect, useMemo, useState } from "react";
import { fetchDashboardStats } from "../services/queries";

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

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const { stats: next, error: qErr } = await fetchDashboardStats();
      if (cancelled) return;
      if (qErr) {
        setError(qErr.message);
        setStats(null);
      } else {
        setStats(next);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const segmentOn = useMemo(() => {
    if (!stats) return 0;
    return Math.min(4, Math.max(0, Math.round((stats.capacityPct / 100) * 4)));
  }, [stats]);

  return (
    <>
      <header className="page-head">
        <div className="page-head-text">
          <h1 className="page-title">Overview Dashboard</h1>
          <p className="page-subtitle">
            Real-time performance analytics for Maa Jaanki Restaurant. Monitoring
            your culinary excellence with precision.
          </p>
        </div>
        <div className="page-date-pill">
          <IconCalendar />
          {formatDatePill()}
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
          <div className="summary-grid">
            <article className="summary-card">
              <div className="summary-card-top">
                <div className="summary-card-icon" aria-hidden="true">
                  <IconBill />
                </div>
                <span className="summary-badge summary-badge--green">+12.5%</span>
              </div>
              <p className="summary-card-kicker">Total revenue</p>
              <p className="summary-card-value">{formatInr(stats.revenue)}</p>
              <div className="summary-progress" aria-hidden="true">
                <div
                  className="summary-progress-fill summary-progress-fill--cyan"
                  style={{ width: "72%" }}
                />
              </div>
            </article>

            <article className="summary-card">
              <div className="summary-card-top">
                <div className="summary-card-icon summary-card-icon--purple" aria-hidden="true">
                  <IconBag />
                </div>
                <span className="summary-badge summary-badge--green">+8.2%</span>
              </div>
              <p className="summary-card-kicker">Total orders</p>
              <p className="summary-card-value">
                {stats.orderCount.toLocaleString("en-IN")}
              </p>
              <div className="summary-progress" aria-hidden="true">
                <div
                  className="summary-progress-fill summary-progress-fill--purple"
                  style={{ width: "58%" }}
                />
              </div>
            </article>

            <article className="summary-card summary-card--live">
              <div className="summary-card-top">
                <div className="summary-card-icon" aria-hidden="true">
                  <IconCalendar />
                </div>
                <span className="summary-badge summary-badge--live">LIVE</span>
              </div>
              <p className="summary-card-kicker">Today&apos;s revenue</p>
              <p className="summary-card-value summary-card-value--cyan">
                {stats.hasDailyBreakdown
                  ? formatInr(stats.todayRevenue)
                  : "—"}
              </p>
              <p className="summary-card-meta">
                {stats.hasDailyBreakdown
                  ? "From orders placed today"
                  : "Add created_at on orders for daily totals"}
              </p>
            </article>

            <article className="summary-card">
              <div className="summary-card-top">
                <div className="summary-card-icon summary-card-icon--muted" aria-hidden="true">
                  <IconUtensils />
                </div>
                <span className="summary-badge summary-badge--neutral">
                  {stats.capacityPct}% capacity
                </span>
              </div>
              <p className="summary-card-kicker">Today&apos;s orders</p>
              <p className="summary-card-value">
                {stats.hasDailyBreakdown
                  ? stats.todayOrderCount.toLocaleString("en-IN")
                  : "—"}
              </p>
              <div className="summary-progress-segments" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={i < segmentOn ? "is-on" : ""} />
                ))}
              </div>
            </article>
          </div>

          <section className="prediction-banner" aria-labelledby="prediction-heading">
            <div className="prediction-banner-bg" aria-hidden="true" />
            <div className="prediction-banner-inner">
              <h2 id="prediction-heading">
                Evening rush prediction: high volume
              </h2>
              <p>
                Expect up to 20% more orders between 8:00 PM and 10:00 PM. Prep
                stations and riders accordingly.
              </p>
              <div className="prediction-actions">
                <button type="button" className="btn btn-primary">
                  <IconBolt />
                  Optimize staffing
                </button>
                <button type="button" className="btn btn-ghost">
                  View details
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
