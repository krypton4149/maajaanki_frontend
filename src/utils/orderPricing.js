import { orderGrandTotal } from "../services/queries";

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * Subtotal, coupon/discount, and payable total for an order row + line items.
 * Uses optional DB fields when present; otherwise infers discount from line sum vs `total`.
 */
export function getOrderPricing(order) {
  const lines = order?.order_items ?? [];
  const subtotal = roundMoney(orderGrandTotal(lines));

  const storedSubtotal =
    order?.subtotal != null && order.subtotal !== ""
      ? Number(order.subtotal)
      : NaN;
  const lineSubtotal = !Number.isNaN(storedSubtotal) ? roundMoney(storedSubtotal) : subtotal;

  const storedTotal =
    order?.total != null && order.total !== ""
      ? Number(order.total)
      : NaN;
  const hasStoredTotal = !Number.isNaN(storedTotal) && storedTotal >= 0;
  const total = hasStoredTotal ? roundMoney(storedTotal) : lineSubtotal;

  const storedDiscount =
    order?.discount_amount != null && order.discount_amount !== ""
      ? Number(order.discount_amount)
      : order?.discount != null && order.discount !== ""
        ? Number(order.discount)
        : NaN;

  let discount = 0;
  if (!Number.isNaN(storedDiscount) && storedDiscount > 0) {
    discount = roundMoney(storedDiscount);
  } else {
    const inferred = lineSubtotal - total;
    if (inferred > 0.009) discount = roundMoney(inferred);
  }

  const hasDiscount = discount > 0.009;

  const couponCode = (
    order?.coupon_code ??
    order?.couponCode ??
    order?.coupon ??
    ""
  )
    .toString()
    .trim();
  const couponPercentRaw =
    order?.coupon_percent != null && order.coupon_percent !== ""
      ? Number(order.coupon_percent)
      : NaN;
  const couponPercent = !Number.isNaN(couponPercentRaw) ? couponPercentRaw : null;

  let couponLabel = "";
  if (couponCode && couponPercent != null) {
    couponLabel = `${couponCode} (${couponPercent}% OFF)`;
  } else if (couponCode) {
    couponLabel = couponCode;
  } else if (hasDiscount && lineSubtotal > 0) {
    const pct = Math.round((discount / lineSubtotal) * 100);
    const expected = roundMoney((lineSubtotal * pct) / 100);
    if (pct > 0 && pct <= 100 && Math.abs(expected - discount) < 1.5) {
      couponLabel = `${pct}% OFF`;
    }
  }

  return {
    subtotal: lineSubtotal,
    discount,
    total,
    hasDiscount,
    couponCode,
    couponLabel,
    paymentMethod: order?.payment_method ?? order?.paymentMethod ?? "",
  };
}

/** Human label for `payment_method` from API (`cod` | `upi`). */
export function formatPaymentMethod(method) {
  const key = (method ?? "").toString().trim().toLowerCase();
  if (!key) return "";
  if (key === "cod") return "Cash on delivery";
  if (key === "upi") return "UPI";
  return method;
}
