import { getOrders } from "@/lib/server/orders";
import { readJsonFile, writeJsonFile } from "@/lib/server/storage";

const ADMIN_ORDER_SEEN_FILE = "admin-order-seen.json";

type AdminOrderSeenState = {
  lastSeenAt: string | null;
};

async function getSeenState(): Promise<AdminOrderSeenState> {
  return readJsonFile<AdminOrderSeenState>(ADMIN_ORDER_SEEN_FILE, { lastSeenAt: null });
}

async function ensureSeenStateInitialized(): Promise<AdminOrderSeenState> {
  const state = await getSeenState();
  if (state.lastSeenAt) return state;
  const initialized: AdminOrderSeenState = { lastSeenAt: new Date().toISOString() };
  await writeJsonFile(ADMIN_ORDER_SEEN_FILE, initialized);
  return initialized;
}

export async function getUnseenOrdersCount(): Promise<number> {
  const [orders, seenState] = await Promise.all([getOrders(), ensureSeenStateInitialized()]);
  const seenAt = Date.parse(seenState.lastSeenAt ?? "");
  if (!Number.isFinite(seenAt)) return 0;
  return orders.filter((order) => Date.parse(order.createdAt) > seenAt).length;
}

export async function markOrdersSeenNow(): Promise<void> {
  await writeJsonFile<AdminOrderSeenState>(ADMIN_ORDER_SEEN_FILE, {
    lastSeenAt: new Date().toISOString(),
  });
}

