import { supabase } from "./supabase";
import { getOrderPricing } from "../utils/orderPricing";

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
        "id, order_num, customer_name, phone, whatsapp, address, status, out_for_delivery, total, currency, placed_at"
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

export function orderLineTotal(item) {
  const qty = item.qty ?? 1;
  const unit = Number(item.unit_price);
  return unit * qty;
}

export function orderGrandTotal(orderItems) {
  if (!orderItems?.length) return 0;
  return orderItems.reduce((sum, row) => sum + orderLineTotal(row), 0);
}

function localDayIsoRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function fetchDashboardStats() {
  const itemsRes = await supabase
    .from("order_items")
    .select("order_id, unit_price, qty");

  if (itemsRes.error) return { error: itemsRes.error, stats: null };

  let ordersRes = await supabase
    .from("orders")
    .select("id, customer_name, phone, total, placed_at");

  let dailyField = null;
  if (!ordersRes.error) {
    dailyField = "placed_at";
  } else {
    ordersRes = await supabase
      .from("orders")
      .select("id, customer_name, phone, total, created_at");
    if (!ordersRes.error) dailyField = "created_at";
  }

  if (ordersRes.error) {
    ordersRes = await supabase
      .from("orders")
      .select("id, customer_name, phone, total");
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

  let revenue = 0;
  let discountsGiven = 0;
  for (const order of orders) {
    const pricing = getOrderPricing({
      ...order,
      order_items: itemsByOrder.get(order.id) ?? [],
    });
    revenue += pricing.total;
    discountsGiven += pricing.discount;
  }

  const phones = new Set(orders.map((o) => o.phone).filter(Boolean));

  const { start, end } = localDayIsoRange();
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();

  const todayOrders = hasDaily
    ? orders.filter((o) => {
        const raw = o[dailyField];
        if (!raw) return false;
        const t = new Date(raw).getTime();
        return t >= startMs && t <= endMs;
      })
    : [];

  const todayOrderIds = new Set(todayOrders.map((o) => o.id));

  let todayRevenue = 0;
  let todayDiscounts = 0;
  for (const order of todayOrders) {
    const pricing = getOrderPricing({
      ...order,
      order_items: itemsByOrder.get(order.id) ?? [],
    });
    todayRevenue += pricing.total;
    todayDiscounts += pricing.discount;
  }

  const todayOrderCount = hasDaily ? todayOrderIds.size : 0;

  const capacityPct = Math.min(
    100,
    orders.length === 0 ? 0 : Math.round((orders.length / 50) * 100) || 12
  );

  return {
    error: null,
    stats: {
      orderCount: orders.length,
      revenue,
      customerCount: phones.size || orders.length,
      todayOrderCount,
      todayRevenue,
      discountsGiven,
      todayDiscounts,
      hasDailyBreakdown: hasDaily,
      capacityPct,
    },
  };
}
