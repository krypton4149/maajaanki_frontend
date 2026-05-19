function formatInr(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function weekdayLabel() {
  return new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(new Date());
}

export default function DashboardHero({ stats }) {
  if (!stats) return null;

  const { pipeline, kitchenLoad } = stats;
  const loadLabel =
    kitchenLoad === "busy"
      ? "Kitchen busy"
      : kitchenLoad === "moderate"
        ? "Moderate flow"
        : "Light day";

  return (
    <div
      className={`dash-hero dash-hero--${kitchenLoad}`}
      role="status"
      aria-live="polite"
    >
      <div className="dash-hero__main">
        <p className="dash-hero__eyebrow">{weekdayLabel()} · {loadLabel}</p>
        <p className="dash-hero__line">
          {stats.hasDailyBreakdown ? (
            <>
              <strong>{stats.todayOrderCount}</strong> orders today ·{" "}
              <strong>{formatInr(stats.todayRevenue)}</strong> collected
              {stats.todayDiscounts > 0 && (
                <>
                  {" "}
                  · <span className="dash-hero__discount">
                    {formatInr(stats.todayDiscounts)} saved
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <strong>{stats.orderCount}</strong> orders in system ·{" "}
              <strong>{formatInr(stats.revenue)}</strong> total collected
            </>
          )}
        </p>
      </div>
      {pipeline.total > 0 && (
        <div className="dash-hero__pipeline" aria-label="Active orders in kitchen">
          <span>{pipeline.confirmed} new</span>
          <span className="dash-hero__dot" aria-hidden="true" />
          <span>{pipeline.preparing} prep</span>
          <span className="dash-hero__dot" aria-hidden="true" />
          <span>{pipeline.outForDelivery} out</span>
        </div>
      )}
    </div>
  );
}
