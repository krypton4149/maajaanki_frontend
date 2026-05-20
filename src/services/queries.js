import { emojiForMenuItem } from "../data/menuItemEmoji";
import { supabase } from "./supabase";
import { getOrderPricing } from "../utils/orderPricing";

/** "DELUXE THALI" → "Deluxe Thali" for display. */
function formatDishName(name) {
  const s = (name ?? "").trim();
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveOrderItemName(row, menuById) {
  let name = (row.item_name ?? "").trim();
  if ((!name || name.toLowerCase() === "item") && row.menu_item_id) {
    const fromMenu = menuById.get(row.menu_item_id);
    if (fromMenu) name = fromMenu;
  }
  return formatDishName(name) || "Unknown item";
}

export async function fetchMenuCategories() {
  return supabase
    .from("menu_categories")
    .select("id, title, sort_order")
    .order("sort_order", { ascending: true });
}

export async function fetchMenuItems() {
  return supabase
    .from("menu_items")
    .select("id, category_id, name, price, veg, sort_order, active")
    .eq("active", true)
    .order("sort_order", { ascending: true });
}

/**
 * Orders with line items. Uses embedded `order_items` when PostgREST sees the FK;
 * otherwise loads both tables and merges on `order_id`.
 */
const ORDERS_LIST_COLUMNS = `
      id,
      order_num,
      customer_name,
      phone,
      whatsapp,
      address,
      status,
      out_for_delivery,
      subtotal,
      discount_amount,
      coupon_code,
      payment_method,
      payment_status,
      upi_transaction_id,
      payment_verified,
      payment_verified_at,
      total,
      currency,
      placed_at,
      order_items (
        id,
        menu_item_id,
        item_name,
        unit_price,
        qty,
        veg
      )
    `;

export async function fetchOrdersWithItems() {
  const embedded = await supabase
    .from("orders")
    .select(ORDERS_LIST_COLUMNS)
    .order("order_num", { ascending: false });

  if (!embedded.error) return embedded;

  const [ordersRes, itemsRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, order_num, customer_name, phone, whatsapp, address, status, out_for_delivery, subtotal, discount_amount, coupon_code, payment_method, payment_status, upi_transaction_id, payment_verified, payment_verified_at, total, currency, placed_at"
      )
      .order("order_num", { ascending: false }),
    supabase
      .from("order_items")
      .select(
        "id, order_id, menu_item_id, item_name, unit_price, qty, veg"
      ),
  ]);

  const err = ordersRes.error || itemsRes.error;
  if (err) return { data: null, error: err };

  const byOrder = new Map();
  for (const row of itemsRes.data ?? []) {
    const list = byOrder.get(row.order_id) ?? [];
    list.push(row);
    byOrder.set(row.order_id, list);
  }

  const merged = (ordersRes.data ?? []).map((o) => ({
    ...o,
    order_items: byOrder.get(o.id) ?? [],
  }));

  return { data: merged, error: null };
}

/**
 * Persist "out for delivery" on the order row (matches `orders.out_for_delivery` bool).
 */
export async function setOrderOutForDelivery(orderId) {
  return supabase
    .from("orders")
    .update({ out_for_delivery: true })
    .eq("id", orderId);
}

/** Mark UPI payment verified after admin confirms transaction ID matches. */
export async function verifyOrderPayment(orderId) {
  const verifiedAt = new Date().toISOString();
  return supabase
    .from("orders")
    .update({
      payment_verified: true,
      payment_verified_at: verifiedAt,
    })
    .eq("id", orderId)
    .select(
      "id, payment_verified, payment_verified_at, upi_transaction_id, payment_method"
    )
    .single();
}

export function orderLineTotal(item) {
  const qty = item.qty ?? 1;
  const unit = Number(item.unit_price);
  return unit * qty;
}

export function orderGrandTotal(orderItems) {
  if (!orderItems?.length) return 0;
  return orderItems.reduce((sum, row) => sum + orderLineTotal(row), 0);
}

function localDayIsoRange(offsetDays = 0) {
  const start = new Date();
  start.setDate(start.getDate() + offsetDays);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    startMs: start.getTime(),
    endMs: end.getTime(),
  };
}

function orderTimestamp(order, dailyField) {
  const raw = dailyField ? order[dailyField] : null;
  if (!raw) return null;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : t;
}

function ordersInDayRange(orders, dailyField, startMs, endMs) {
  if (!dailyField) return [];
  return orders.filter((o) => {
    const t = orderTimestamp(o, dailyField);
    return t != null && t >= startMs && t <= endMs;
  });
}

function sumPricingForOrders(orders, itemsByOrder) {
  let grossSubtotal = 0;
  let revenue = 0;
  let discounts = 0;
  for (const order of orders) {
    const pricing = getOrderPricing({
      ...order,
      order_items: itemsByOrder.get(order.id) ?? [],
    });
    grossSubtotal += pricing.subtotal;
    revenue += pricing.total;
    discounts += pricing.discount;
  }
  return { grossSubtotal, revenue, discounts };
}

function pipelineCounts(orders) {
  let confirmed = 0;
  let preparing = 0;
  let outForDelivery = 0;
  for (const o of orders) {
    if (o.out_for_delivery === true) {
      outForDelivery += 1;
      continue;
    }
    const st = (o.status || "").toLowerCase();
    if (st.includes("prep")) preparing += 1;
    else confirmed += 1;
  }
  const total = confirmed + preparing + outForDelivery;
  return { confirmed, preparing, outForDelivery, total };
}

function trendPct(today, yesterday) {
  if (yesterday <= 0) return today > 0 ? 100 : null;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

export async function fetchDashboardStats() {
  const [itemsRes, menuRes] = await Promise.all([
    supabase
      .from("order_items")
      .select("order_id, unit_price, qty, item_name, menu_item_id, veg"),
    supabase.from("menu_items").select("id, name"),
  ]);

  if (itemsRes.error) return { error: itemsRes.error, stats: null };

  const menuById = new Map(
    (menuRes.data ?? []).map((m) => [m.id, m.name])
  );

  let ordersRes = await supabase
    .from("orders")
    .select(
      "id, order_num, customer_name, phone, status, out_for_delivery, subtotal, discount_amount, coupon_code, payment_method, upi_transaction_id, payment_verified, payment_verified_at, total, placed_at"
    );

  let dailyField = null;
  if (!ordersRes.error) {
    dailyField = "placed_at";
  } else {
    ordersRes = await supabase
      .from("orders")
      .select(
        "id, order_num, customer_name, phone, status, out_for_delivery, subtotal, discount_amount, coupon_code, payment_method, upi_transaction_id, payment_verified, payment_verified_at, total, created_at"
      );
    if (!ordersRes.error) dailyField = "created_at";
  }

  if (ordersRes.error) {
    ordersRes = await supabase
      .from("orders")
      .select(
        "id, order_num, customer_name, phone, status, out_for_delivery, subtotal, discount_amount, coupon_code, payment_method, upi_transaction_id, payment_verified, payment_verified_at, total"
      );
  }

  if (ordersRes.error) return { error: ordersRes.error, stats: null };

  const hasDaily = dailyField !== null;
  const orders = ordersRes.data ?? [];
  const lines = itemsRes.data ?? [];

  const itemsByOrder = new Map();
  for (const row of lines) {
    const list = itemsByOrder.get(row.order_id) ?? [];
    list.push(row);
    itemsByOrder.set(row.order_id, list);
  }

  let grossSubtotal = 0;
  let revenue = 0;
  let discountsGiven = 0;
  let ordersWithDiscount = 0;
  const ordersWithItems = [];

  for (const order of orders) {
    const orderItems = itemsByOrder.get(order.id) ?? [];
    const pricing = getOrderPricing({ ...order, order_items: orderItems });
    grossSubtotal += pricing.subtotal;
    revenue += pricing.total;
    discountsGiven += pricing.discount;
    if (pricing.hasDiscount) ordersWithDiscount += 1;
    ordersWithItems.push({ ...order, order_items: orderItems, pricing });
  }

  const phones = new Set(orders.map((o) => o.phone).filter(Boolean));

  const todayRange = localDayIsoRange(0);
  const yesterdayRange = localDayIsoRange(-1);

  const todayOrders = hasDaily
    ? ordersInDayRange(orders, dailyField, todayRange.startMs, todayRange.endMs)
    : [];
  const yesterdayOrders = hasDaily
    ? ordersInDayRange(
        orders,
        dailyField,
        yesterdayRange.startMs,
        yesterdayRange.endMs
      )
    : [];

  const todayOrderIds = new Set(todayOrders.map((o) => o.id));

  const todayTotals = sumPricingForOrders(todayOrders, itemsByOrder);
  const todayGrossSubtotal = todayTotals.grossSubtotal;
  const todayRevenue = todayTotals.revenue;
  const todayDiscounts = todayTotals.discounts;
  let todayOrdersWithDiscount = 0;
  for (const order of todayOrders) {
    const p = getOrderPricing({
      ...order,
      order_items: itemsByOrder.get(order.id) ?? [],
    });
    if (p.hasDiscount) todayOrdersWithDiscount += 1;
  }

  const yesterdayTotals = sumPricingForOrders(yesterdayOrders, itemsByOrder);
  const yesterdayRevenue = yesterdayTotals.revenue;
  const yesterdayOrderCount = yesterdayOrders.length;

  const recentOrders = [...ordersWithItems]
    .sort((a, b) => Number(b.order_num ?? 0) - Number(a.order_num ?? 0))
    .slice(0, 5);

  const pendingUpiVerifications = ordersWithItems
    .filter((o) => {
      const method = (o.payment_method ?? "").toString().trim().toLowerCase();
      return (
        method === "upi" &&
        (o.upi_transaction_id ?? "").toString().trim() &&
        o.payment_verified !== true
      );
    })
    .sort((a, b) => Number(b.order_num ?? 0) - Number(a.order_num ?? 0));

  const todayOrderCount = hasDaily ? todayOrderIds.size : 0;

  const capacityPct = Math.min(
    100,
    orders.length === 0 ? 0 : Math.round((orders.length / 50) * 100) || 12
  );

  const pipeline = pipelineCounts(orders);

  const paymentSplit = {
    cod: { count: 0, total: 0 },
    upi: { count: 0, total: 0 },
    other: { count: 0, total: 0 },
  };
  for (const order of todayOrders) {
    const pricing = getOrderPricing({
      ...order,
      order_items: itemsByOrder.get(order.id) ?? [],
    });
    const key = (order.payment_method ?? "").toString().trim().toLowerCase();
    const bucket =
      key === "cod" ? "cod" : key === "upi" ? "upi" : "other";
    paymentSplit[bucket].count += 1;
    paymentSplit[bucket].total += pricing.total;
  }

  const dishCounts = new Map();
  for (const row of lines) {
    if (!todayOrderIds.has(row.order_id)) continue;
    const name = resolveOrderItemName(row, menuById);
    const qty = row.qty ?? 1;
    const prev = dishCounts.get(name) ?? { qty: 0, veg: true };
    dishCounts.set(name, {
      qty: prev.qty + qty,
      veg: prev.veg && row.veg !== false,
    });
  }
  const topDishes = [...dishCounts.entries()]
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 3)
    .map(([name, meta]) => ({
      name,
      qty: meta.qty,
      emoji: emojiForMenuItem(name, "", meta.veg),
    }));

  const revenueByDay = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const range = localDayIsoRange(-offset);
    const dayOrders = hasDaily
      ? ordersInDayRange(orders, dailyField, range.startMs, range.endMs)
      : [];
    const { revenue: dayRevenue } = sumPricingForOrders(dayOrders, itemsByOrder);
    const d = new Date(range.startMs);
    revenueByDay.push({
      key: range.start.slice(0, 10),
      label: new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(d),
      shortLabel: new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
      }).format(d),
      revenue: dayRevenue,
      orderCount: dayOrders.length,
      isToday: offset === 0,
    });
  }

  const maxDayRevenue = Math.max(...revenueByDay.map((d) => d.revenue), 1);

  const hour = new Date().getHours();
  const isRushWindow = hour >= 19 && hour < 22;
  const kitchenLoad =
    pipeline.total >= 10 ? "busy" : pipeline.total >= 5 ? "moderate" : "light";

  return {
    error: null,
    stats: {
      orderCount: orders.length,
      grossSubtotal,
      revenue,
      discountsGiven,
      ordersWithDiscount,
      customerCount: phones.size || orders.length,
      todayOrderCount,
      todayGrossSubtotal,
      todayRevenue,
      todayDiscounts,
      todayOrdersWithDiscount,
      yesterdayRevenue,
      yesterdayOrderCount,
      revenueTrendPct: trendPct(todayRevenue, yesterdayRevenue),
      ordersTrendPct: trendPct(todayOrderCount, yesterdayOrderCount),
      recentOrders,
      pendingUpiVerifications,
      hasDailyBreakdown: hasDaily,
      capacityPct,
      pipeline,
      paymentSplit,
      topDishes,
      revenueByDay,
      maxDayRevenue,
      isRushWindow,
      showRushBanner: isRushWindow || todayOrderCount >= 8,
      kitchenLoad,
    },
  };
}
