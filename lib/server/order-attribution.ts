import { readJsonFile, writeJsonFile } from "@/lib/server/storage";

const ORDER_ATTRIBUTION_FILE = "order-attribution.json";

export type OrderAttributionRecord = {
  orderId: string;
  orderNumber: string;
  purchaseEventId?: string;
  fbp?: string;
  fbc?: string;
  fbclid?: string;
  gclid?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPath?: string;
  metaPurchaseSentAt?: string;
  updatedAt: string;
};

type Store = Record<string, OrderAttributionRecord>;

async function readStore(): Promise<Store> {
  return readJsonFile<Store>(ORDER_ATTRIBUTION_FILE, {});
}

async function writeStore(store: Store): Promise<void> {
  await writeJsonFile(ORDER_ATTRIBUTION_FILE, store);
}

export async function upsertOrderAttribution(
  record: Omit<OrderAttributionRecord, "updatedAt"> & { updatedAt?: string }
): Promise<void> {
  const store = await readStore();
  const previous = store[record.orderId];
  store[record.orderId] = {
    ...previous,
    ...record,
    updatedAt: record.updatedAt ?? new Date().toISOString(),
  };
  await writeStore(store);
}

export async function getOrderAttributionByOrderId(
  orderId: string
): Promise<OrderAttributionRecord | null> {
  const store = await readStore();
  return store[orderId] ?? null;
}

export async function getOrderAttributionByOrderNumber(
  orderNumber: string
): Promise<OrderAttributionRecord | null> {
  const store = await readStore();
  const item = Object.values(store).find((entry) => entry.orderNumber === orderNumber);
  return item ?? null;
}

export async function markMetaPurchaseSent(orderId: string): Promise<void> {
  const store = await readStore();
  const current = store[orderId];
  if (!current) return;
  store[orderId] = {
    ...current,
    metaPurchaseSentAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await writeStore(store);
}
