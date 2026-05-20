import { useNavigate } from "react-router-dom";
import UpiPaymentVerify from "./UpiPaymentVerify";
import { formatPaymentMethod } from "../utils/orderPricing";

function formatInr(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function initials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const a = parts[0][0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}

function formatPlacedShort(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return null;
  }
}

function orderStatusMeta(order) {
  if (order.out_for_delivery === true) {
    return { label: "Out for delivery", className: "status-pill--delivery" };
  }
  const raw = (order.status || "").trim().toLowerCase();
  if (raw === "preparing") {
    return { label: "Preparing", className: "status-pill--preparing" };
  }
  if (raw === "dispatched") {
    return { label: "Dispatched", className: "status-pill--dispatched" };
  }
  if (raw.includes("out") && raw.includes("deliver")) {
    return { label: "Out for delivery", className: "status-pill--delivery" };
  }
  return { label: "Confirmed", className: "status-pill--received" };
}

const AVATAR_CYCLE = [
  "cell-avatar--cyan",
  "cell-avatar--purple",
  "cell-avatar--green",
];

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

function IconChevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
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

function RecentOrderRow({ order, index, onOpen }) {
  const { pricing } = order;
  const payment = formatPaymentMethod(pricing.paymentMethod);
  const status = orderStatusMeta(order);
  const placed = formatPlacedShort(order.placed_at ?? order.created_at);
  const avatarClass = AVATAR_CYCLE[index % AVATAR_CYCLE.length];
  const couponDisplay = pricing.couponCode || pricing.couponLabel || null;
  const isUpi = (order.payment_method ?? "").toString().trim().toLowerCase() === "upi";
  const upiId = (order.upi_transaction_id ?? "").toString().trim();
  const upiPending = isUpi && upiId && order.payment_verified !== true;

  return (
    <button
      type="button"
      className="recent-order-card"
      onClick={onOpen}
      aria-label={`Order MJ-${order.order_num}, ${order.customer_name ?? "Guest"}, ${formatInr(pricing.total)}`}
    >
      <div className="recent-order-card__left">
        <span className={`recent-order-card__avatar cell-avatar ${avatarClass}`}>
          {initials(order.customer_name)}
        </span>
        <div className="recent-order-card__info">
          <div className="recent-order-card__title-row">
            <span className="recent-order-card__id">#MJ-{order.order_num}</span>
            {placed ? <span className="recent-order-card__time">{placed}</span> : null}
          </div>
          <p className="recent-order-card__name">{order.customer_name ?? "Guest"}</p>
          <div className="recent-order-card__tags">
            <span className={`status-pill ${status.className}`}>{status.label}</span>
            {payment ? (
              <span className="recent-order-card__pay">{payment}</span>
            ) : null}
            {upiPending ? (
              <span className="recent-order-card__upi-pending">Verify UPI</span>
            ) : null}
            {isUpi && upiId ? (
              <span className="recent-order-card__upi-id" title="UPI transaction ID">
                {upiId}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="recent-order-card__breakdown" aria-label="Order amounts">
        {pricing.hasDiscount ? (
          <dl className="recent-order-card__amounts">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatInr(pricing.subtotal)}</dd>
            </div>
            <div>
              <dt>Discount</dt>
              <dd className="recent-order-card__amount--discount">
                −{formatInr(pricing.discount)}
              </dd>
            </div>
            {couponDisplay ? (
              <div className="recent-order-card__coupon-row">
                <dt>Coupon</dt>
                <dd>
                  <span className="recent-order-card__coupon">{couponDisplay}</span>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="recent-order-card__full-price">No discount applied</p>
        )}
      </div>

      <div className="recent-order-card__right">
        <span className="recent-order-card__paid-label">Collected</span>
        <span className="recent-order-card__total">{formatInr(pricing.total)}</span>
        <span className="recent-order-card__chevron" aria-hidden="true">
          <IconChevron />
        </span>
      </div>
    </button>
  );
}

function PendingUpiCard({ order, onVerified, onOpenOrder }) {
  return (
    <article className="upi-pending-card">
      <div className="upi-pending-card__head">
        <button
          type="button"
          className="upi-pending-card__order-link"
          onClick={onOpenOrder}
        >
          #MJ-{order.order_num} · {order.customer_name ?? "Guest"}
        </button>
      </div>
      <UpiPaymentVerify
        order={order}
        compact
        onVerified={(patch) => onVerified(order.id, patch)}
      />
    </article>
  );
}

export default function DashboardSalesPanel({ stats, onOrderPatched }) {
  const navigate = useNavigate();

  if (!stats) return null;

  const openOrders = () => navigate("/orders");
  const openOrder = (order) => navigate(`/orders?order=${order.id}`);
  const pendingUpi = stats.pendingUpiVerifications ?? [];

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
        <button type="button" className="btn btn-ghost" onClick={openOrders}>
          View all orders
        </button>
      </div>

      {pendingUpi.length > 0 ? (
        <article className="dashboard-sales-card dashboard-sales-card--wide dashboard-sales-card--upi">
          <div className="dashboard-sales-card-head">
            <h3>UPI payments to verify</h3>
            <p className="dashboard-recent-hint">
              Match the ID from your bank app with the order, then click Done.
            </p>
          </div>
          <div className="upi-pending-list">
            {pendingUpi.map((order) => (
              <PendingUpiCard
                key={order.id}
                order={order}
                onOpenOrder={() => openOrder(order)}
                onVerified={onOrderPatched}
              />
            ))}
          </div>
        </article>
      ) : null}

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
            <span
              className="dashboard-sales-card-icon dashboard-sales-card-icon--live"
              aria-hidden="true"
            >
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
          <div className="dashboard-sales-card-head dashboard-sales-card-head--recent">
            <h3>Recent orders</h3>
            <p className="dashboard-recent-hint">Tap a row to view order details</p>
          </div>

          {stats.recentOrders?.length > 0 ? (
            <div className="recent-orders-table">
              <div className="recent-orders-table__head" aria-hidden="true">
                <span>Order</span>
                <span>Breakdown</span>
                <span>Collected</span>
              </div>
              <div className="recent-orders-table__body">
                {stats.recentOrders.map((order, index) => (
                  <RecentOrderRow
                    key={order.id}
                    order={order}
                    index={index}
                    onOpen={() => openOrder(order)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="dashboard-breakdown-empty">No orders yet.</p>
          )}
        </article>
      </div>
    </section>
  );
}
