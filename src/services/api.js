const API = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function apiUrl(path) {
  if (!API) {
    throw new Error("VITE_API_URL is not set");
  }
  return `${API}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * POST /api/coupons/validate — matches checkout "Apply coupon".
 * @returns {Promise<{ valid: boolean, discount?: number, finalTotal?: number, message?: string }>}
 */
export async function validateCoupon(code, subtotal) {
  const res = await fetch(apiUrl("/api/coupons/validate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotal }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : `Coupon check failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

/**
 * POST /api/orders — place order after customer confirms.
 */
export async function placeOrder({
  customer,
  items,
  couponCode,
  paymentMethod,
}) {
  const res = await fetch(apiUrl("/api/orders"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer,
      items,
      couponCode: couponCode || undefined,
      paymentMethod,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : `Order failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

function adminHeaders() {
  const key = import.meta.env.VITE_ADMIN_VERIFY_KEY;
  if (!key) {
    throw new Error(
      "VITE_ADMIN_VERIFY_KEY is not set. Add it to .env for payment verification."
    );
  }
  return {
    "Content-Type": "application/json",
    "x-admin-key": key,
  };
}

/**
 * POST /api/admin/orders/verify-payment — marks paid in DB and sends WhatsApp confirmation.
 * @param {{ orderNum?: number, orderId?: string }} params
 */
export async function verifyOrderPaymentAdmin({ orderNum, orderId }) {
  const body =
    orderNum != null && orderNum !== ""
      ? { orderNum: Number(orderNum) }
      : orderId
        ? { orderId }
        : null;
  if (!body) {
    throw new Error("Order number or order id is required.");
  }

  const res = await fetch(apiUrl("/api/admin/orders/verify-payment"), {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : `Verification failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

/**
 * POST /api/admin/orders/send-confirmation — resend WhatsApp when already verified in DB.
 */
export async function resendOrderConfirmationAdmin({ orderNum, orderId }) {
  const body =
    orderNum != null && orderNum !== ""
      ? { orderNum: Number(orderNum) }
      : orderId
        ? { orderId }
        : null;
  if (!body) {
    throw new Error("Order number or order id is required.");
  }

  const res = await fetch(apiUrl("/api/admin/orders/send-confirmation"), {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : `Resend failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

/**
 * POST /api/admin/orders/reject-payment — cancel order + WhatsApp (e.g. UPI txn mismatch).
 */
export async function rejectOrderPaymentAdmin({ orderNum, orderId }) {
  const body =
    orderNum != null && orderNum !== ""
      ? { orderNum: Number(orderNum) }
      : orderId
        ? { orderId }
        : null;
  if (!body) {
    throw new Error("Order number or order id is required.");
  }

  const res = await fetch(apiUrl("/api/admin/orders/reject-payment"), {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : `Reject failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}
