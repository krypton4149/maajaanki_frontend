import { useMemo, useState } from "react";
import {
  rejectOrderPaymentAdmin,
  resendOrderConfirmationAdmin,
  verifyOrderPaymentAdmin,
} from "../services/api";

function normalizeTxnId(value) {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .trim();
}

function formatVerifiedAt(iso) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

function isUpiOrder(order) {
  return (order?.payment_method ?? "").toString().trim().toLowerCase() === "upi";
}

function isRejectedStatus(status) {
  const s = (status ?? "").toString().trim().toLowerCase();
  return s === "rejected" || s === "cancelled" || s === "canceled";
}

/**
 * Admin matches bank UPI txn ID, then calls backend verify-payment (DB + WhatsApp).
 */
export default function UpiPaymentVerify({
  order,
  onVerified,
  onRejected,
  compact = false,
  className = "",
}) {
  const [inputId, setInputId] = useState("");
  const [busy, setBusy] = useState(false);
  const [rejectBusy, setRejectBusy] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [resendBusy, setResendBusy] = useState(false);

  const storedId = (order?.upi_transaction_id ?? "").toString().trim();
  const verified = order?.payment_verified === true;
  const rejected = isRejectedStatus(order?.status);
  const verifiedAtLabel = formatVerifiedAt(order?.payment_verified_at);

  const txnMismatch = useMemo(() => {
    if (!storedId) return false;
    const entered = normalizeTxnId(inputId);
    if (!entered) return false;
    return entered !== normalizeTxnId(storedId);
  }, [inputId, storedId]);

  if (!order || !isUpiOrder(order)) return null;

  async function handleVerify(e) {
    e?.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!storedId) {
      setError("No UPI transaction ID saved on this order yet.");
      return;
    }

    const entered = normalizeTxnId(inputId);
    const stored = normalizeTxnId(storedId);

    if (!entered) {
      setError("Enter the transaction ID from your UPI or bank app.");
      return;
    }

    if (entered !== stored) {
      setError("Transaction ID does not match the one on this order.");
      return;
    }

    setBusy(true);
    try {
      const data = await verifyOrderPaymentAdmin({
        orderNum: order.order_num,
        orderId: order.id,
      });
      setInputId("");
      setSuccessMessage(
        data.message || "Payment verified. Order confirmation sent on WhatsApp."
      );
      onVerified?.({
        payment_verified: true,
        payment_verified_at: new Date().toISOString(),
      });
    } catch (err) {
      setError(err.message || "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRejectMismatch() {
    if (!txnMismatch) return;

    const ok = window.confirm(
      `Send cancel message for order #MJ-${order.order_num}? The UPI transaction ID does not match.`
    );
    if (!ok) return;

    setError(null);
    setSuccessMessage(null);
    setRejectBusy(true);
    try {
      const data = await rejectOrderPaymentAdmin({
        orderNum: order.order_num,
        orderId: order.id,
      });
      setSuccessMessage(
        data.message ||
          "Order cancelled. Customer notified on WhatsApp (transaction ID mismatch)."
      );
      onRejected?.({
        status: "rejected",
        payment_verified: false,
      });
    } catch (err) {
      setError(err.message || "Could not cancel order.");
    } finally {
      setRejectBusy(false);
    }
  }

  async function handleResend() {
    setError(null);
    setResendBusy(true);
    try {
      const data = await resendOrderConfirmationAdmin({
        orderNum: order.order_num,
        orderId: order.id,
      });
      setSuccessMessage(
        data.message || "Order confirmation resent on WhatsApp."
      );
    } catch (err) {
      setError(err.message || "Could not resend confirmation.");
    } finally {
      setResendBusy(false);
    }
  }

  if (rejected) {
    return (
      <div
        className={`upi-verify upi-verify--rejected${compact ? " upi-verify--compact" : ""}${className ? ` ${className}` : ""}`}
      >
        <span className="upi-verify__badge upi-verify__badge--rejected">
          Order cancelled
        </span>
        {storedId ? (
          <p className="upi-verify__stored">
            UPI ID on order: <code>{storedId}</code>
          </p>
        ) : null}
        {successMessage ? (
          <p className="upi-verify__success" role="status">
            {successMessage}
          </p>
        ) : (
          <p className="upi-verify__meta">Payment rejected — txn ID did not match.</p>
        )}
      </div>
    );
  }

  if (verified) {
    return (
      <div
        className={`upi-verify upi-verify--done${compact ? " upi-verify--compact" : ""}${className ? ` ${className}` : ""}`}
      >
        <span className="upi-verify__badge upi-verify__badge--ok">Payment verified</span>
        {storedId ? (
          <p className="upi-verify__stored">
            UPI ID: <code>{storedId}</code>
          </p>
        ) : null}
        {successMessage ? (
          <p className="upi-verify__success" role="status">
            {successMessage}
          </p>
        ) : verifiedAtLabel ? (
          <p className="upi-verify__meta">Verified {verifiedAtLabel}</p>
        ) : null}
        {error ? (
          <p className="upi-verify__error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="btn btn-ghost upi-verify__resend"
          disabled={resendBusy}
          onClick={handleResend}
        >
          {resendBusy ? "Sending…" : "Resend WhatsApp confirmation"}
        </button>
      </div>
    );
  }

  return (
    <form
      className={`upi-verify${compact ? " upi-verify--compact" : ""}${className ? ` ${className}` : ""}`}
      onSubmit={handleVerify}
    >
      <div className="upi-verify__head">
        <span className="upi-verify__badge upi-verify__badge--pending">
          UPI — pending verification
        </span>
      </div>
      {storedId ? (
        <p className="upi-verify__stored">
          On order: <code>{storedId}</code>
        </p>
      ) : (
        <p className="upi-verify__hint">Customer has not submitted a UPI transaction ID yet.</p>
      )}
      <label className="upi-verify__label">
        <span>Match transaction ID from bank / UPI app</span>
        <input
          type="text"
          className="upi-verify__input"
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          placeholder="Paste or type UPI transaction ID"
          autoComplete="off"
          inputMode="numeric"
          disabled={busy || rejectBusy || !storedId}
        />
      </label>
      {error ? (
        <p className="upi-verify__error" role="alert">
          {error}
        </p>
      ) : null}
      {successMessage ? (
        <p className="upi-verify__success" role="status">
          {successMessage}
        </p>
      ) : null}
      <div className="upi-verify__actions">
        <button
          type="submit"
          className="btn btn-primary upi-verify__done"
          disabled={busy || rejectBusy || !storedId || txnMismatch}
        >
          {busy ? "Verifying…" : "Verify payment"}
        </button>
        {txnMismatch ? (
          <button
            type="button"
            className="btn btn-ghost upi-verify__reject"
            disabled={busy || rejectBusy}
            onClick={handleRejectMismatch}
          >
            {rejectBusy
              ? "Cancelling…"
              : "Cancel order — send txn mismatch message"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
