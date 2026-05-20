import { useState } from "react";
import {
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

/**
 * Admin matches bank UPI txn ID, then calls backend verify-payment (DB + WhatsApp).
 */
export default function UpiPaymentVerify({
  order,
  onVerified,
  compact = false,
  className = "",
}) {
  const [inputId, setInputId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [resendBusy, setResendBusy] = useState(false);

  if (!order || !isUpiOrder(order)) return null;

  const storedId = (order.upi_transaction_id ?? "").toString().trim();
  const verified = order.payment_verified === true;
  const verifiedAtLabel = formatVerifiedAt(order.payment_verified_at);

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
          disabled={busy || !storedId}
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
      <button
        type="submit"
        className="btn btn-primary upi-verify__done"
        disabled={busy || !storedId}
      >
        {busy ? "Verifying…" : "Verify payment"}
      </button>
    </form>
  );
}
