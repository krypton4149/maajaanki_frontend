import { useState } from "react";
import { verifyOrderPayment } from "../services/queries";

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
 * Admin checks bank/UPI app txn ID against `orders.upi_transaction_id`, then marks verified.
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

  if (!order || !isUpiOrder(order)) return null;

  const storedId = (order.upi_transaction_id ?? "").toString().trim();
  const verified = order.payment_verified === true;
  const verifiedAtLabel = formatVerifiedAt(order.payment_verified_at);

  async function handleVerify(e) {
    e?.preventDefault();
    setError(null);

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
    const { data, error: upErr } = await verifyOrderPayment(order.id);
    setBusy(false);

    if (upErr) {
      setError(
        upErr.message ||
          "Could not update payment status. Check UPDATE policy on orders."
      );
      return;
    }

    setInputId("");
    onVerified?.({
      payment_verified: true,
      payment_verified_at: data?.payment_verified_at ?? new Date().toISOString(),
    });
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
        {verifiedAtLabel ? (
          <p className="upi-verify__meta">Verified {verifiedAtLabel}</p>
        ) : null}
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
      <button
        type="submit"
        className="btn btn-primary upi-verify__done"
        disabled={busy || !storedId}
      >
        {busy ? "Saving…" : "Done — mark payment verified"}
      </button>
    </form>
  );
}
