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
