import { emojiForMenuItem } from "../data/menuItemEmoji";

function formatInr(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function IconChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3 20h18M7 16l4-6 4 3 5-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
      <path d="M16 11h.01M3 11h4" strokeLinecap="round" />
    </svg>
  );
}

function IconFlame() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M12 3c-1.5 3-4 4.5-4 8a4 4 0 108 0c0-3.5-2.5-5-4-8z" />
    </svg>
  );
}

function PaymentRow({ label, count, total, accent }) {
  if (count === 0) return null;
  return (
    <div className={`dash-pay-row dash-pay-row--${accent}`}>
      <span className="dash-pay-row__label">{label}</span>
      <span className="dash-pay-row__meta">
        {count} order{count !== 1 ? "s" : ""}
      </span>
      <span className="dash-pay-row__amount">{formatInr(total)}</span>
    </div>
  );
}

function PipelineBar({ label, count, total, fillClass }) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((count / total) * 100));
  return (
    <div className="dash-pipeline-row">
      <div className="dash-pipeline-label">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="widget-bar-track">
        <div
          className={`widget-bar-fill ${fillClass}`}
          style={{ width: `${pct || (count > 0 ? 8 : 0)}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardInsights({ stats }) {
  if (!stats) return null;

  const { paymentSplit, topDishes, revenueByDay, maxDayRevenue, pipeline } = stats;
  const payTotal =
    paymentSplit.cod.total + paymentSplit.upi.total + paymentSplit.other.total;

  return (
    <section className="dash-insights" aria-label="Kitchen insights">
      <div className="dash-insights-grid">
        <article className="dash-insight-card">
          <div className="dash-insight-card__head">
            <span className="dash-insight-card__icon" aria-hidden="true">
              <IconWallet />
            </span>
            <h3>Payments today</h3>
          </div>
          {!stats.hasDailyBreakdown ? (
            <p className="dashboard-breakdown-empty">Daily breakdown unavailable.</p>
          ) : payTotal === 0 && stats.todayOrderCount === 0 ? (
            <p className="dashboard-breakdown-empty">No orders placed today yet.</p>
          ) : (
            <div className="dash-pay-list">
              <PaymentRow
                label="Cash on delivery"
                count={paymentSplit.cod.count}
                total={paymentSplit.cod.total}
                accent="cod"
              />
              <PaymentRow
                label="UPI"
                count={paymentSplit.upi.count}
                total={paymentSplit.upi.total}
                accent="upi"
              />
              <PaymentRow
                label="Other"
                count={paymentSplit.other.count}
                total={paymentSplit.other.total}
                accent="other"
              />
              <div className="dash-pay-total">
                <span>Total collected</span>
                <span>{formatInr(stats.todayRevenue)}</span>
              </div>
            </div>
          )}
        </article>

        <article className="dash-insight-card">
          <div className="dash-insight-card__head">
            <span className="dash-insight-card__icon dash-insight-card__icon--warm" aria-hidden="true">
              <IconFlame />
            </span>
            <h3>Top dishes today</h3>
          </div>
          {!stats.hasDailyBreakdown ? (
            <p className="dashboard-breakdown-empty">Daily breakdown unavailable.</p>
          ) : topDishes.length === 0 ? (
            <p className="dashboard-breakdown-empty">No items sold today yet.</p>
          ) : (
            <ul className="dash-top-dishes">
              {topDishes.map((dish, i) => (
                <li key={dish.name}>
                  <span className="dash-top-dishes__rank">{i + 1}</span>
                  <span className="dash-top-dishes__emoji" aria-hidden="true">
                    {emojiForMenuItem(dish.name)}
                  </span>
                  <span className="dash-top-dishes__name">{dish.name}</span>
                  <span className="dash-top-dishes__qty">{dish.qty} sold</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="dash-insight-card dash-insight-card--wide">
          <div className="dash-insight-card__head">
            <span className="dash-insight-card__icon" aria-hidden="true">
              <IconChart />
            </span>
            <h3>Revenue · last 7 days</h3>
          </div>
          {!stats.hasDailyBreakdown ? (
            <p className="dashboard-breakdown-empty">Add placed_at for daily charts.</p>
          ) : (
            <div className="dash-revenue-chart" role="img" aria-label="Seven day revenue chart">
              {revenueByDay.map((day) => {
                const pct = Math.round((day.revenue / maxDayRevenue) * 100);
                return (
                  <div
                    key={day.key}
                    className={`dash-revenue-chart__col${day.isToday ? " dash-revenue-chart__col--today" : ""}`}
                  >
                    <span className="dash-revenue-chart__value">
                      {day.revenue > 0 ? formatInr(day.revenue) : "—"}
                    </span>
                    <div
                      className="dash-revenue-chart__bar-wrap"
                      title={`${day.shortLabel}: ${formatInr(day.revenue)}, ${day.orderCount} orders`}
                    >
                      <div
                        className="dash-revenue-chart__bar"
                        style={{ height: `${Math.max(pct, day.revenue > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                    <span className="dash-revenue-chart__label">{day.label}</span>
                    <span className="dash-revenue-chart__orders">
                      {day.orderCount} {day.orderCount === 1 ? "order" : "orders"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="dash-insight-card">
          <div className="dash-insight-card__head">
            <h3>Kitchen pipeline</h3>
            <span className="dash-insight-card__meta">{pipeline.total} active</span>
          </div>
          <PipelineBar
            label="New & confirmed"
            count={pipeline.confirmed}
            total={pipeline.total}
            fillClass="widget-bar-fill--cyan"
          />
          <PipelineBar
            label="Preparing"
            count={pipeline.preparing}
            total={pipeline.total}
            fillClass="widget-bar-fill--purple"
          />
          <PipelineBar
            label="Out for delivery"
            count={pipeline.outForDelivery}
            total={pipeline.total}
            fillClass="widget-bar-fill--green"
          />
        </article>
      </div>
    </section>
  );
}
