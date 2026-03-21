import type { EmailSettings } from "@/types";
import { readJsonFile, writeJsonFile } from "@/lib/server/storage";

const EMAIL_SETTINGS_FILE = "email-settings.json";

export const defaultEmailSettings: EmailSettings = {
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: (process.env.SMTP_SECURE ?? "false") === "true",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  fromName: "BabyOnline.hu",
  fromEmail: "hello@babyonline.hu",
  replyTo: "hello@babyonline.hu",
  orderConfirmationEnabled: true,
  orderStatusUpdateEnabled: true,
  adminNewOrderEnabled: true,
  adminNotificationEmail: "hello@babyonline.hu",
};

export async function getEmailSettings(): Promise<EmailSettings> {
  const stored = await readJsonFile<Partial<EmailSettings>>(EMAIL_SETTINGS_FILE, {});
  return {
    ...defaultEmailSettings,
    ...stored,
  };
}

export async function saveEmailSettings(input: Partial<EmailSettings>): Promise<EmailSettings> {
  const current = await getEmailSettings();
  const next: EmailSettings = {
    ...current,
    ...input,
    smtpPort: Number(input.smtpPort ?? current.smtpPort),
    smtpSecure: Boolean(input.smtpSecure ?? current.smtpSecure),
    orderConfirmationEnabled: Boolean(
      input.orderConfirmationEnabled ?? current.orderConfirmationEnabled
    ),
    orderStatusUpdateEnabled: Boolean(
      input.orderStatusUpdateEnabled ?? current.orderStatusUpdateEnabled
    ),
    adminNewOrderEnabled: Boolean(input.adminNewOrderEnabled ?? current.adminNewOrderEnabled),
  };
  await writeJsonFile(EMAIL_SETTINGS_FILE, next);
  return next;
}

export function getSafeEmailSettings(settings: EmailSettings): Omit<EmailSettings, "smtpPass"> & {
  smtpPass: string;
} {
  return {
    ...settings,
    smtpPass: settings.smtpPass ? "********" : "",
  };
}
