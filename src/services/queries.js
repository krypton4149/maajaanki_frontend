import { supabase } from "./supabase";

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
    .select("id, customer_name, phone, created_at");

  let hasDaily = true;
  if (ordersRes.error) {
    ordersRes = await supabase
      .from("orders")
      .select("id, customer_name, phone");
    hasDaily = false;
  }

  if (ordersRes.error) return { error: ordersRes.error, stats: null };

  const orders = ordersRes.data ?? [];
  const lines = itemsRes.data ?? [];

  const revenue = lines.reduce(
    (sum, row) => sum + Number(row.unit_price) * (row.qty ?? 1),
    0
  );

  const phones = new Set(orders.map((o) => o.phone).filter(Boolean));

  const { start, end } = localDayIsoRange();
  const todayOrderIds = new Set(
    hasDaily
      ? orders
          .filter((o) => {
            if (!o.created_at) return false;
            const t = new Date(o.created_at).getTime();
            return t >= new Date(start).getTime() && t <= new Date(end).getTime();
          })
          .map((o) => o.id)
      : []
  );

  const todayRevenue = hasDaily
    ? lines
        .filter((row) => todayOrderIds.has(row.order_id))
        .reduce((sum, row) => sum + Number(row.unit_price) * (row.qty ?? 1), 0)
    : 0;

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
      hasDailyBreakdown: hasDaily,
      capacityPct,
    },
  };
}
