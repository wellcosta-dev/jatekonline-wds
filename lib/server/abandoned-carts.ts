import { readJsonFile, writeJsonFile } from "@/lib/server/storage";
import { sendCustomEmail } from "@/lib/email/sender";

const CARTS_FILE = "abandoned-carts.json";
const SETTINGS_FILE = "abandoned-cart-settings.json";

export interface AbandonedCartSettings {
  enabled: boolean;
  inactivityMinutes: number;
  reminderDelayMinutes: number;
  maxReminders: number;
}

export interface AbandonedCartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export type AbandonedCartStatus = "ACTIVE" | "ABANDONED" | "RECOVERED" | "CLEARED";

export interface AbandonedCartRecord {
  id: string;
  sessionId: string;
  userEmail?: string;
  userId?: string;
  items: AbandonedCartItem[];
  totalItems: number;
  subtotal: number;
  status: AbandonedCartStatus;
  reminderCount: number;
  lastReminderAt?: string;
  recoveredOrderNumber?: string;
  createdAt: string;
  lastActivityAt: string;
  updatedAt: string;
}

const defaultSettings: AbandonedCartSettings = {
  enabled: true,
  inactivityMinutes: 45,
  reminderDelayMinutes: 120,
  maxReminders: 2,
};

export async function getAbandonedCartSettings(): Promise<AbandonedCartSettings> {
  const stored = await readJsonFile<Partial<AbandonedCartSettings>>(SETTINGS_FILE, {});
  return {
    ...defaultSettings,
    ...stored,
    inactivityMinutes: Number(stored.inactivityMinutes ?? defaultSettings.inactivityMinutes),
    reminderDelayMinutes: Number(stored.reminderDelayMinutes ?? defaultSettings.reminderDelayMinutes),
    maxReminders: Number(stored.maxReminders ?? defaultSettings.maxReminders),
  };
}

export async function saveAbandonedCartSettings(
  input: Partial<AbandonedCartSettings>
): Promise<AbandonedCartSettings> {
  const current = await getAbandonedCartSettings();
  const next: AbandonedCartSettings = {
    ...current,
    ...input,
    inactivityMinutes: Math.max(5, Number(input.inactivityMinutes ?? current.inactivityMinutes)),
    reminderDelayMinutes: Math.max(5, Number(input.reminderDelayMinutes ?? current.reminderDelayMinutes)),
    maxReminders: Math.max(0, Number(input.maxReminders ?? current.maxReminders)),
  };
  await writeJsonFile(SETTINGS_FILE, next);
  return next;
}

async function readRecords(): Promise<AbandonedCartRecord[]> {
  return readJsonFile<AbandonedCartRecord[]>(CARTS_FILE, []);
}

async function writeRecords(records: AbandonedCartRecord[]): Promise<void> {
  await writeJsonFile(CARTS_FILE, records);
}

function markStatuses(
  records: AbandonedCartRecord[],
  settings: AbandonedCartSettings
): AbandonedCartRecord[] {
  const now = Date.now();
  return records.map((record) => {
    if (record.status === "RECOVERED" || record.status === "CLEARED") return record;
    const inactiveMs = now - new Date(record.lastActivityAt).getTime();
    const shouldAbandon = inactiveMs >= settings.inactivityMinutes * 60 * 1000;
    return {
      ...record,
      status: shouldAbandon ? "ABANDONED" : "ACTIVE",
    };
  });
}

export async function trackAbandonedCartActivity(input: {
  sessionId: string;
  userEmail?: string;
  userId?: string;
  items: AbandonedCartItem[];
  subtotal: number;
  clear?: boolean;
}): Promise<void> {
  if (!input.sessionId) return;
  const settings = await getAbandonedCartSettings();
  if (!settings.enabled) return;

  const now = new Date().toISOString();
  const records = await readRecords();
  const withStatuses = markStatuses(records, settings);
  const index = withStatuses.findIndex((entry) => entry.sessionId === input.sessionId);

  if (input.clear || input.items.length === 0) {
    if (index >= 0) {
      withStatuses[index] = {
        ...withStatuses[index],
        items: [],
        subtotal: 0,
        totalItems: 0,
        status: "CLEARED",
        lastActivityAt: now,
        updatedAt: now,
      };
      await writeRecords(withStatuses);
    }
    return;
  }

  const next: AbandonedCartRecord = {
    id: index >= 0 ? withStatuses[index].id : `ac-${Date.now()}`,
    sessionId: input.sessionId,
    userEmail: input.userEmail?.toLowerCase(),
    userId: input.userId,
    items: input.items,
    subtotal: input.subtotal,
    totalItems: input.items.reduce((sum, item) => sum + item.quantity, 0),
    status: "ACTIVE",
    reminderCount: index >= 0 ? withStatuses[index].reminderCount : 0,
    lastReminderAt: index >= 0 ? withStatuses[index].lastReminderAt : undefined,
    createdAt: index >= 0 ? withStatuses[index].createdAt : now,
    lastActivityAt: now,
    updatedAt: now,
    recoveredOrderNumber: index >= 0 ? withStatuses[index].recoveredOrderNumber : undefined,
  };
  if (index >= 0) withStatuses[index] = next;
  else withStatuses.unshift(next);
  await writeRecords(withStatuses);
}

export async function markAbandonedCartRecoveredByEmail(
  email: string,
  orderNumber: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  const records = await readRecords();
  const next = records.map((entry) => {
    if (entry.userEmail !== normalized) return entry;
    if (entry.status === "RECOVERED") return entry;
    return {
      ...entry,
      status: "RECOVERED" as const,
      recoveredOrderNumber: orderNumber,
      updatedAt: new Date().toISOString(),
    };
  });
  await writeRecords(next);
}

export async function getAbandonedCartsWithAutomation(): Promise<AbandonedCartRecord[]> {
  const settings = await getAbandonedCartSettings();
  let records = await readRecords();
  records = markStatuses(records, settings);

  const now = Date.now();
  const nextRecords: AbandonedCartRecord[] = [];
  for (const record of records) {
    if (
      settings.enabled &&
      record.status === "ABANDONED" &&
      record.userEmail &&
      record.reminderCount < settings.maxReminders
    ) {
      const lastReminderAt = record.lastReminderAt ? new Date(record.lastReminderAt).getTime() : 0;
      const dueMs = settings.reminderDelayMinutes * 60 * 1000;
      const due = lastReminderAt === 0 || now - lastReminderAt >= dueMs;
      if (due) {
        try {
          const lines = record.items
            .slice(0, 5)
            .map((item) => `${item.productName} (${item.quantity} db)`)
            .join(", ");
          await sendCustomEmail({
            to: record.userEmail,
            subject: "Valami a kosaradban maradt - BabyOnline.hu",
            text: `Szia! A kosaradban maradt néhány termék: ${lines}.`,
            html: `<p>Szia!</p><p>A kosaradban maradt néhány termék:</p><p><strong>${lines}</strong></p><p>Ha szeretnéd, folytasd a rendelést a webshopban.</p>`,
          });
          record.reminderCount += 1;
          record.lastReminderAt = new Date().toISOString();
          record.updatedAt = new Date().toISOString();
        } catch {
          // SMTP might be unavailable, keep record intact
        }
      }
    }
    nextRecords.push(record);
  }

  await writeRecords(nextRecords);
  return [...nextRecords].sort(
    (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
  );
}
