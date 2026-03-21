import { readJsonFile, writeJsonFile } from "@/lib/server/storage";

export interface NotificationSettings {
  newOrderNotification: boolean;
  lowStockAlert: boolean;
  weeklySummary: boolean;
  aiAgentAlert: boolean;
}

const NOTIFICATION_SETTINGS_FILE = "notification-settings.json";

const defaultNotificationSettings: NotificationSettings = {
  newOrderNotification: true,
  lowStockAlert: true,
  weeklySummary: true,
  aiAgentAlert: true,
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const stored = await readJsonFile<Partial<NotificationSettings>>(
    NOTIFICATION_SETTINGS_FILE,
    {}
  );
  return {
    ...defaultNotificationSettings,
    ...stored,
  };
}

export async function saveNotificationSettings(
  input: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  const current = await getNotificationSettings();
  const next: NotificationSettings = {
    ...current,
    ...input,
  };
  await writeJsonFile(NOTIFICATION_SETTINGS_FILE, next);
  return next;
}
