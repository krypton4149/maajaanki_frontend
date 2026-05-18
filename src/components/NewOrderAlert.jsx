import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { unlockOrderNotificationSound } from "../utils/orderNotificationSound";

function IconBellRing() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M18 8A6 6 0 006 8c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" />
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

function displayCustomerName(order) {
  const name = (order.customer_name ?? "").trim();
  if (name) return name;
  return "a customer";
}

export default function NewOrderAlert({ order, onDismiss }) {
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  if (!order) return null;

  const customer = displayCustomerName(order);
  const orderLabel =
    order.order_num != null ? `#MJ-${order.order_num}` : null;

  function handleViewOrders() {
    unlockOrderNotificationSound();
    onDismiss();
    navigate("/orders");
  }

  return (
    <div
      className="new-order-alert-backdrop"
      role="presentation"
      onClick={onDismiss}
    >
      <article
        className="new-order-alert-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="new-order-alert-title"
        aria-describedby="new-order-alert-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="new-order-alert-close"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <IconX />
        </button>

        <div className="new-order-alert-icon" aria-hidden="true">
          <IconBellRing />
        </div>

        <p className="new-order-alert-kicker">New order</p>
        <h2 id="new-order-alert-title" className="new-order-alert-title">
          Order received
        </h2>
        <p id="new-order-alert-desc" className="new-order-alert-message">
          We received a new order from{" "}
          <strong>{customer}</strong>
          {orderLabel ? (
            <>
              {" "}
              <span className="new-order-alert-order-id">({orderLabel})</span>
            </>
          ) : null}
          .
        </p>

        <div className="new-order-alert-actions">
          <button type="button" className="btn btn-primary" onClick={handleViewOrders}>
            View in Live Orders
          </button>
          <button type="button" className="btn btn-ghost" onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      </article>
    </div>
  );
}
