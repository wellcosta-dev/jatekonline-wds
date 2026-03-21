import { readJsonFile, writeJsonFile } from "@/lib/server/storage";
import { getOrders } from "@/lib/server/orders";
import { getEffectiveProducts } from "@/lib/server/products";
import { getAiAgentsState } from "@/lib/server/ai-agents";
import { getNotificationSettings } from "@/lib/server/notification-settings";

export interface AdminNotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  href: string;
  unread: boolean;
  type: "order" | "stock" | "ai" | "summary";
}

interface NotificationReadState {
  lastReadAt: number;
}

const NOTIFICATION_READ_FILE = "admin-notification-read-state.json";

async function getReadState(): Promise<NotificationReadState> {
  return readJsonFile<NotificationReadState>(NOTIFICATION_READ_FILE, { lastReadAt: 0 });
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  await writeJsonFile<NotificationReadState>(NOTIFICATION_READ_FILE, {
    lastReadAt: Date.now(),
  });
}

function relativeTime(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);
  const min = Math.floor(diff / 60000);
  if (min <= 1) return "Most";
  if (min < 60) return `${min} perce`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} órája`;
  const day = Math.floor(hour / 24);
  return `${day} napja`;
}

function getWeeklySummaryTimestampMs(): number {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

export async function getAdminNotifications(): Promise<AdminNotificationItem[]> {
  const [readState, settings, orders, products, aiState] = await Promise.all([
    getReadState(),
    getNotificationSettings(),
    getOrders(),
    getEffectiveProducts(),
    getAiAgentsState(),
  ]);

  const items: Array<AdminNotificationItem & { createdAtMs: number }> = [];

  if (settings.newOrderNotification) {
    const newestOrder = orders
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (newestOrder) {
      const createdAtMs = new Date(newestOrder.createdAt).getTime();
      items.push({
        id: `order-${newestOrder.id}`,
        title: "Új rendelés érkezett",
        description: `${newestOrder.orderNumber} · ${newestOrder.total.toLocaleString("hu-HU")} Ft`,
        time: relativeTime(createdAtMs),
        href: "/admin/rendelesek",
        unread: createdAtMs > readState.lastReadAt,
        type: "order",
        createdAtMs,
      });
    }
  }

  if (settings.lowStockAlert) {
    const lowStockProducts = products.filter((product) => product.stock > 0 && product.stock < 5);
    const lowStockCount = lowStockProducts.length;
    if (lowStockCount > 0) {
      const createdAtMs = lowStockProducts.reduce((latest, product) => {
        const productTs = new Date(product.updatedAt || product.createdAt).getTime();
        return Math.max(latest, productTs);
      }, 0);
      items.push({
        id: "stock-low",
        title: "Alacsony készlet",
        description: `${lowStockCount} termék 5 db alatt`,
        time: relativeTime(createdAtMs),
        href: "/admin/termekek",
        unread: createdAtMs > readState.lastReadAt,
        type: "stock",
        createdAtMs,
      });
    }
  }

  if (settings.aiAgentAlert) {
    const latestFailed = aiState.activity
      .filter((item) => !item.success)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (latestFailed) {
      const createdAtMs = new Date(latestFailed.createdAt).getTime();
      items.push({
        id: `ai-${latestFailed.id}`,
        title: "AI agent riasztás",
        description: latestFailed.action,
        time: relativeTime(createdAtMs),
        href: "/admin/ai-agentek",
        unread: createdAtMs > readState.lastReadAt,
        type: "ai",
        createdAtMs,
      });
    }
  }

  if (settings.weeklySummary) {
    const weeklyRevenue = orders
      .filter((order) => {
        const created = new Date(order.createdAt).getTime();
        return Date.now() - created <= 7 * 24 * 60 * 60 * 1000 && order.status !== "CANCELLED";
      })
      .reduce((sum, order) => sum + order.total, 0);
    const createdAtMs = getWeeklySummaryTimestampMs();
    items.push({
      id: "weekly-summary",
      title: "Heti összesítő",
      description: `Forgalom 7 napra: ${weeklyRevenue.toLocaleString("hu-HU")} Ft`,
      time: relativeTime(createdAtMs),
      href: "/admin",
      unread: createdAtMs > readState.lastReadAt,
      type: "summary",
      createdAtMs,
    });
  }

  return items
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .map(({ createdAtMs, ...item }) => item)
    .slice(0, 20);
}
