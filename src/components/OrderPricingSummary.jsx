import { getOrderPricing } from "../utils/orderPricing";

function formatInr(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

/**
 * WhatsApp-style subtotal → coupon/discount → total block.
 */
export default function OrderPricingSummary({ order, className = "" }) {
  const { subtotal, discount, total, hasDiscount, couponLabel } =
    getOrderPricing(order);

  return (
    <div className={`order-pricing${className ? ` ${className}` : ""}`}>
      <div className="order-pricing-row">
        <span>Subtotal</span>
        <span>{formatInr(subtotal)}</span>
      </div>
      {hasDiscount && (
        <>
          {couponLabel ? (
            <div className="order-pricing-row order-pricing-row--muted">
              <span>Coupon</span>
              <span>{couponLabel}</span>
            </div>
          ) : null}
          <div className="order-pricing-row order-pricing-row--discount">
            <span>Discount</span>
            <span>−{formatInr(discount)}</span>
          </div>
        </>
      )}
      <div className="order-pricing-row order-pricing-row--total">
        <span>Total</span>
        <span>{formatInr(total)}</span>
      </div>
    </div>
  );
}
