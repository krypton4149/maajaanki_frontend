import { useNavigate } from "react-router-dom";
import { formatPaymentMethod } from "../utils/orderPricing";

function formatInr(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function IconTag() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2H4z" />
      <path d="M8 7h8M8 11h8M8 15h5" strokeLinecap="round" />
    </svg>
  );
}

function RevenueBreakdown({ label, subtotal, discount, total, ordersWithDiscount, orderCount }) {
  const hasDiscount = discount > 0;

  return (
    <div className="dashboard-breakdown-block">
      <p className="dashboard-breakdown-label">{label}</p>
      <div className="order-pricing order-pricing--dashboard">
        <div className="order-pricing-row">
          <span>Subtotal</span>
          <span>{formatInr(subtotal)}</span>
        </div>
        {hasDiscount ? (
          <div className="order-pricing-row order-pricing-row--discount">
            <span>Discount</span>
            <span>−{formatInr(discount)}</span>
          </div>
        ) : (
          <div className="order-pricing-row order-pricing-row--muted">
            <span>Discount</span>
            <span>—</span>
          </div>
        )}
        <div className="order-pricing-row order-pricing-row--total">
          <span>Total collected</span>
          <span>{formatInr(total)}</span>
        </div>
      </div>
      {orderCount > 0 && (
        <p className="dashboard-breakdown-foot">
          {ordersWithDiscount > 0
            ? `${ordersWithDiscount} of ${orderCount} orders used a coupon or discount`
            : `${orderCount} orders · no discounts yet`}
        </p>
      )}
    </div>
  );
}

function RecentOrderRow({ order, onOpen }) {
  const { pricing } = order;
  const payment = formatPaymentMethod(pricing.paymentMethod);

  return (
    <button type="button" className="dashboard-recent-row" onClick={onOpen}>
      <div className="dashboard-recent-row-main">
        <span className="dashboard-recent-id">#MJ-{order.order_num}</span>
        <span className="dashboard-recent-name">{order.customer_name ?? "Guest"}</span>
      </div>
      <div className="dashboard-recent-row-pricing">
        {pricing.hasDiscount ? (
          <>
            <span className="dashboard-recent-sub">{formatInr(pricing.subtotal)}</span>
            <span className="dashboard-recent-discount">−{formatInr(pricing.discount)}</span>
          </>
        ) : null}
        <span className="dashboard-recent-total">{formatInr(pricing.total)}</span>
      </div>
      {(pricing.couponLabel || payment) && (
        <div className="dashboard-recent-meta">
          {pricing.couponLabel ? (
            <span className="dashboard-recent-coupon">{pricing.couponLabel}</span>
          ) : null}
          {payment ? <span>{payment}</span> : null}
        </div>
      )}
    </button>
  );
}

export default function DashboardSalesPanel({ stats }) {
  const navigate = useNavigate();

  if (!stats) return null;

  return (
    <section className="dashboard-sales" aria-labelledby="dashboard-sales-heading">
      <div className="dashboard-sales-head">
        <div>
          <h2 id="dashboard-sales-heading" className="dashboard-sales-title">
            Sales &amp; discounts
          </h2>
          <p className="dashboard-sales-lede">
            Subtotal, coupon savings, and amounts collected — same view as order
            confirmations.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => navigate("/orders")}
        >
          View all orders
        </button>
      </div>

      <div className="dashboard-sales-grid">
        <article className="dashboard-sales-card">
          <div className="dashboard-sales-card-head">
            <span className="dashboard-sales-card-icon" aria-hidden="true">
              <IconReceipt />
            </span>
            <h3>All-time breakdown</h3>
          </div>
          <RevenueBreakdown
            label="Lifetime"
            subtotal={stats.grossSubtotal}
            discount={stats.discountsGiven}
            total={stats.revenue}
            ordersWithDiscount={stats.ordersWithDiscount}
            orderCount={stats.orderCount}
          />
        </article>

        <article className="dashboard-sales-card dashboard-sales-card--live">
          <div className="dashboard-sales-card-head">
            <span className="dashboard-sales-card-icon dashboard-sales-card-icon--live" aria-hidden="true">
              <IconTag />
            </span>
            <h3>Today</h3>
            <span className="summary-badge summary-badge--live">LIVE</span>
          </div>
          {stats.hasDailyBreakdown ? (
            <RevenueBreakdown
              label="Today"
              subtotal={stats.todayGrossSubtotal}
              discount={stats.todayDiscounts}
              total={stats.todayRevenue}
              ordersWithDiscount={stats.todayOrdersWithDiscount}
              orderCount={stats.todayOrderCount}
            />
          ) : (
            <p className="dashboard-breakdown-empty">
              Add <code>placed_at</code> on orders to see today&apos;s subtotal,
              discounts, and total.
            </p>
          )}
        </article>

        <article className="dashboard-sales-card dashboard-sales-card--wide">
          <div className="dashboard-sales-card-head">
            <h3>Recent orders</h3>
          </div>
          {stats.recentOrders?.length > 0 ? (
            <div className="dashboard-recent-list">
              {stats.recentOrders.map((order) => (
                <RecentOrderRow
                  key={order.id}
                  order={order}
                  onOpen={() => navigate("/orders")}
                />
              ))}
            </div>
          ) : (
            <p className="dashboard-breakdown-empty">No orders yet.</p>
          )}
        </article>
      </div>
    </section>
  );
}
