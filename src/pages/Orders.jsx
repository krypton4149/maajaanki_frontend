import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import OrderPricingSummary from "../components/OrderPricingSummary";
import {
  fetchOrdersWithItems,
  orderLineTotal,
  setOrderOutForDelivery,
} from "../services/queries";
import { getOrderPricing } from "../utils/orderPricing";

function formatInr(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatPlacedAt(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

function initials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const a = parts[0][0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}

/** Single contact number: prefer `phone`; else normalize `whatsapp` (e.g. strip leading 91). */
function displayPhoneOne(order) {
  const p = (order.phone ?? "").toString().trim();
  if (p) return p;
  const w = (order.whatsapp ?? "").toString().trim().replace(/^\+/, "");
  if (!w) return "—";
  if (/^91\d{10}$/.test(w)) return w.slice(2);
  return w;
}

/** Case-insensitive match on Live Orders search (top bar). */
function orderMatchesSearch(order, qRaw) {
  const q = qRaw.trim().toLowerCase();
  if (!q) return true;

  const idStr = (order.id ?? "").toLowerCase();
  if (idStr.includes(q)) return true;

  const num = String(order.order_num ?? "");
  const idHaystack = `mj-${num} #mj-${num} ${num}`.toLowerCase();
  const qNorm = q.replace(/^#/, "").replace(/\s/g, "");
  if (qNorm && idHaystack.includes(qNorm)) return true;

  if ((order.customer_name ?? "").toLowerCase().includes(q)) return true;

  const phoneDisp = displayPhoneOne(order).toLowerCase();
  const digitsQ = q.replace(/\D/g, "");
  const digitsPhone = phoneDisp.replace(/\D/g, "");
  if (digitsQ.length > 0 && digitsPhone.includes(digitsQ)) return true;
  if (phoneDisp.includes(q)) return true;

  if ((order.address ?? "").toString().toLowerCase().includes(q)) return true;
  if ((order.status ?? "").toLowerCase().includes(q)) return true;

  if (q.includes("out") && order.out_for_delivery === true) return true;

  for (const line of order.order_items ?? []) {
    if ((line.item_name ?? "").toLowerCase().includes(q)) return true;
    if ((line.menu_item_id ?? "").toString().toLowerCase().includes(q))
      return true;
  }
  return false;
}

const STATUS_LOOKUP = {
  confirmed: {
    key: "confirmed",
    label: "Confirmed",
    className: "status-pill--received",
  },
  received: {
    key: "received",
    label: "Received",
    className: "status-pill--received",
  },
  preparing: {
    key: "preparing",
    label: "Preparing",
    className: "status-pill--preparing",
  },
  dispatched: {
    key: "dispatched",
    label: "Dispatched",
    className: "status-pill--dispatched",
  },
  out_for_delivery: {
    key: "out_for_delivery",
    label: "Out for delivery",
    className: "status-pill--delivery",
  },
};

const AVATAR_CYCLE = [
  "cell-avatar--cyan",
  "cell-avatar--purple",
  "cell-avatar--green",
];

const PAGE_SIZE = 4;

/** Map DB row → pill key (respects `out_for_delivery` bool). */
function displayStatusKey(order) {
  if (!order) return "confirmed";
  if (order.out_for_delivery === true) return "out_for_delivery";
  const raw = (order.status || "").trim().toLowerCase();
  if (raw === "confirmed") return "confirmed";
  if (raw === "preparing") return "preparing";
  if (raw === "received") return "received";
  if (raw === "dispatched") return "dispatched";
  if (raw.includes("out") && raw.includes("deliver")) return "out_for_delivery";
  if (STATUS_LOOKUP[raw]) return raw;
  return "confirmed";
}

function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function IconPipeline() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function OrderDetailModal({ order, statusKey, onClose, onMarkDelivery }) {
  const lines = order.order_items ?? [];
  const status = STATUS_LOOKUP[statusKey] ?? STATUS_LOOKUP.confirmed;

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
        aria-labelledby="order-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="order-modal-header">
          <div>
            <h2 id="order-modal-title" className="order-modal-title">
              Order details
            </h2>
            <p className="order-modal-id">#MJ-{order.order_num}</p>
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
            <h3>Status</h3>
            <span className={`status-pill ${status.className}`}>
              {status.label}
            </span>
          </div>

          <div className="order-modal-section">
            <h3>Customer</h3>
            <dl className="order-modal-dl">
              <div>
                <dt>Name</dt>
                <dd>{order.customer_name ?? "—"}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{displayPhoneOne(order)}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{order.address?.trim() ? order.address : "—"}</dd>
              </div>
              <div>
                <dt>Placed</dt>
                <dd>{formatPlacedAt(order.placed_at)}</dd>
              </div>
              <div>
                <dt>DB status</dt>
                <dd>{order.status ?? "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="order-modal-section">
            <h3>Line items</h3>
            <div className="order-modal-lines">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Line</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ color: "var(--color-text-muted)" }}>
                        No line items
                      </td>
                    </tr>
                  ) : (
                    lines.map((line) => (
                      <tr key={line.id}>
                        <td>{line.item_name}</td>
                        <td>{line.qty ?? 1}</td>
                        <td>{formatInr(line.unit_price)}</td>
                        <td>{formatInr(orderLineTotal(line))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <OrderPricingSummary order={order} />
          </div>
        </div>

        <div className="order-modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          {statusKey !== "out_for_delivery" && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onMarkDelivery()}
            >
              <IconCheck />
              Mark out for delivery
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const { ordersSearch = "" } = useOutletContext() ?? {};
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [page, setPage] = useState(0);
  const [detailOrderId, setDetailOrderId] = useState(null);

  const detailOrder = useMemo(
    () => orders.find((o) => o.id === detailOrderId) ?? null,
    [orders, detailOrderId]
  );

  useEffect(() => {
    if (detailOrderId && !detailOrder) setDetailOrderId(null);
  }, [detailOrderId, detailOrder]);

  useEffect(() => {
    if (orders.length === 0) return;
    const id = searchParams.get("order");
    const num = searchParams.get("order_num");
    if (id) {
      setDetailOrderId(id);
      return;
    }
    if (num) {
      const match = orders.find((o) => String(o.order_num) === num);
      if (match) setDetailOrderId(match.id);
    }
  }, [orders, searchParams]);

  const filteredOrders = useMemo(
    () => orders.filter((o) => orderMatchesSearch(o, ordersSearch)),
    [orders, ordersSearch]
  );

  useEffect(() => {
    setPage(0);
  }, [ordersSearch]);

  useEffect(() => {
    if (!detailOrderId) return;
    const q = ordersSearch.trim();
    if (!q) return;
    if (!filteredOrders.some((o) => o.id === detailOrderId)) {
      setDetailOrderId(null);
    }
  }, [detailOrderId, ordersSearch, filteredOrders]);

  useEffect(() => {
    let cancelled = false;

    async function load(silent) {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const { data, error: qErr } = await fetchOrdersWithItems();
      if (cancelled) return;
      if (qErr) {
        setError(qErr.message);
        if (!silent) setOrders([]);
      } else {
        setError(null);
        setOrders(data ?? []);
      }
      if (!silent) setLoading(false);
    }

    load(false);
    const intervalId = setInterval(() => {
      load(true);
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const markOutForDelivery = useCallback(async (orderId) => {
    setUpdateError(null);
    setPendingOrderId(orderId);
    const { error: upErr } = await setOrderOutForDelivery(orderId);
    setPendingOrderId(null);
    if (upErr) {
      setUpdateError(
        `${upErr.message} If RLS is on, add an UPDATE policy for \`orders\` (e.g. anon or authenticated role).`
      );
      return;
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, out_for_delivery: true } : o
      )
    );
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOrderId(null);
    const next = new URLSearchParams(searchParams);
    next.delete("order");
    next.delete("order_num");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const statusCounts = useMemo(() => {
    let active = 0;
    let preparing = 0;
    let dispatched = 0;
    for (const o of filteredOrders) {
      if (o.out_for_delivery === true) {
        dispatched += 1;
        continue;
      }
      const st = (o.status || "").toLowerCase();
      if (st.includes("prep")) preparing += 1;
      else active += 1;
    }
    return { active, preparing, dispatched };
  }, [filteredOrders]);

  /** Share of each lifecycle phase in the current list (updates with search + live poll). */
  const orderPipeline = useMemo(() => {
    const n = filteredOrders.length;
    const pct = (count) =>
      n === 0 ? 0 : Math.min(100, Math.round((count / n) * 100));
    return [
      {
        key: "active",
        label: "New & confirmed",
        pct: pct(statusCounts.active),
        count: statusCounts.active,
        fillClass: "widget-bar-fill--cyan",
      },
      {
        key: "preparing",
        label: "Preparing",
        pct: pct(statusCounts.preparing),
        count: statusCounts.preparing,
        fillClass: "widget-bar-fill--purple",
      },
      {
        key: "dispatched",
        label: "Out / dispatched",
        pct: pct(statusCounts.dispatched),
        count: statusCounts.dispatched,
        fillClass: "widget-bar-fill--green",
      },
    ];
  }, [filteredOrders, statusCounts]);

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageOrders = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, safePage]);

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  const detailStatusKey = detailOrder
    ? displayStatusKey(detailOrder)
    : "confirmed";

  return (
    <>
      <header className="page-head">
        <div className="page-head-text">
          <h1 className="page-title">Live Orders</h1>
          <p className="page-subtitle">
            Track kitchen queue, rider assignment, and customer contact. Use the
            top search bar to filter by customer, order ID, phone, dish, or
            address. Status and out for delivery load from Supabase.
          </p>
        </div>
        <div className="quick-stats" aria-label="Order status summary">
          <div className="quick-stat">
            <span className="quick-stat-value quick-stat-value--cyan">
              {String(statusCounts.active).padStart(2, "0")}
            </span>
            <span className="quick-stat-label">Active</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-value quick-stat-value--green">
              {String(statusCounts.dispatched).padStart(2, "0")}
            </span>
            <span className="quick-stat-label">Out / dispatched</span>
          </div>
        </div>
      </header>

      {loading && <p className="ds-hint">Loading orders…</p>}
      {error && (
        <p className="ds-error" role="alert">
          {error}. Ensure anon can <code>SELECT</code> <code>orders</code> and{" "}
          <code>order_items</code> (RLS policies).
        </p>
      )}
      {updateError && (
        <p className="ds-error" role="alert">
          {updateError}
        </p>
      )}

      {!loading && !error && orders.length === 0 && (
        <p className="ds-hint">No orders yet.</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          {filteredOrders.length === 0 ? (
            <p className="ds-hint" role="status">
              No orders match &quot;{ordersSearch.trim()}&quot;. Clear the search
              box to show all {orders.length} orders.
            </p>
          ) : (
            <div className="data-panel">
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer name</th>
                      <th>Phone number</th>
                      <th>Order items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageOrders.map((order, rowIdx) => {
                      const globalIdx = safePage * PAGE_SIZE + rowIdx;
                      const avatarClass =
                        AVATAR_CYCLE[globalIdx % AVATAR_CYCLE.length];
                      const lines = order.order_items ?? [];
                      const visible = lines.slice(0, 2);
                      const rest = lines.length - visible.length;
                      const statusKey = displayStatusKey(order);
                      const status = STATUS_LOOKUP[statusKey];
                      const isOut = order.out_for_delivery === true;
                      const isPending = pendingOrderId === order.id;
                      const pricing = getOrderPricing(order);

                      return (
                        <tr key={order.id}>
                          <td data-label="Order ID">
                            <span className="cell-order-id">
                              #MJ-{order.order_num}
                            </span>
                          </td>
                          <td data-label="Customer">
                            <div className="cell-customer">
                              <span className={`cell-avatar ${avatarClass}`}>
                                {initials(order.customer_name)}
                              </span>
                              <span>{order.customer_name}</span>
                            </div>
                          </td>
                          <td data-label="Phone">{displayPhoneOne(order)}</td>
                          <td data-label="Order items">
                            <div className="item-tags">
                              {visible.map((line) => (
                                <span key={line.id} className="item-tag">
                                  {line.qty ?? 1}× {line.item_name}
                                </span>
                              ))}
                              {rest > 0 && (
                                <button
                                  type="button"
                                  className="item-tag-more"
                                  onClick={() => setDetailOrderId(order.id)}
                                >
                                  +{rest} more
                                </button>
                              )}
                              {lines.length === 0 && (
                                <span className="item-tag">—</span>
                              )}
                            </div>
                          </td>
                          <td data-label="Total">
                            <div className="cell-order-total">
                              <span className="cell-order-total-amount">
                                {formatInr(pricing.total)}
                              </span>
                              {pricing.hasDiscount && (
                                <span className="cell-order-total-discount">
                                  −{formatInr(pricing.discount)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td data-label="Status">
                            <span className={`status-pill ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                          <td data-label="Actions">
                            <div className="cell-actions">
                              <button
                                type="button"
                                aria-label="View full order details"
                                onClick={() => setDetailOrderId(order.id)}
                              >
                                <IconEye />
                              </button>
                              <button
                                type="button"
                                aria-label="Mark order out for delivery"
                                disabled={isOut || isPending}
                                onClick={() => markOutForDelivery(order.id)}
                              >
                                <IconCheck />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="table-footer">
                <span>
                  Showing {pageOrders.length} of {filteredOrders.length} live orders
                  {ordersSearch.trim() ? ` (${orders.length} total)` : ""}
                </span>
                <div className="table-footer-nav">
                  <button
                    type="button"
                    disabled={safePage <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= pageCount - 1}
                    onClick={() =>
                      setPage((p) => Math.min(pageCount - 1, p + 1))
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="widgets-row">
            <div className="widget-card widget-card--pipeline">
              <h3>
                <IconPipeline />
                Order pipeline
                <span className="widget-h3-meta">
                  {filteredOrders.length} in view
                  {ordersSearch.trim() ? ` · ${orders.length} total` : ""}
                </span>
              </h3>
              <p className="widget-card-lede">
                Each bar is the share of orders in that stage for the list above
                (same filters as the table).
              </p>
              {orderPipeline.map((row) => (
                <div
                  key={row.key}
                  className="widget-bar-row"
                  role="group"
                  aria-label={`${row.label}: ${row.count} orders, ${row.pct} percent of this list`}
                >
                  <div className="widget-bar-label">
                    <span>
                      {row.label}
                      <span className="widget-bar-count"> ({row.count})</span>
                    </span>
                    <span>{row.pct}%</span>
                  </div>
                  <div className="widget-bar-track">
                    <div
                      className={`widget-bar-fill ${row.fillClass}`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="widget-card">
              <div className="widget-split">
                <div>
                  <h3>Estimated prep time</h3>
                  <p className="widget-stat-big">18 mins</p>
                  <p className="widget-stat-trend">↘ −2 mins from last hour</p>
                </div>
                <div className="widget-riders">
                  <h3>Rider availability</h3>
                  <p className="widget-stat-big">06 active</p>
                  <div className="rider-stack" aria-hidden="true">
                    <span className="rider-avatar">R1</span>
                    <span className="rider-avatar">R2</span>
                    <span className="rider-avatar">R3</span>
                    <span className="rider-more">+3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          statusKey={detailStatusKey}
          onClose={closeDetail}
          onMarkDelivery={() => markOutForDelivery(detailOrder.id)}
        />
      )}
    </>
  );
}
