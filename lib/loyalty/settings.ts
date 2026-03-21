import type { LoyaltySettings } from "@/types";
import { readJsonFile, writeJsonFile } from "@/lib/server/storage";

const LOYALTY_SETTINGS_FILE = "loyalty-settings.json";

export const defaultLoyaltySettings: LoyaltySettings = {
  enabled: true,
  earnOnDelivered: true,
  earnDivisor: 100,
  pointValueHuf: 1,
  maxRedeemPercent: 100,
};

export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  const stored = await readJsonFile<Partial<LoyaltySettings>>(LOYALTY_SETTINGS_FILE, {});
  return {
    ...defaultLoyaltySettings,
    ...stored,
    earnDivisor: Number(stored.earnDivisor ?? defaultLoyaltySettings.earnDivisor),
    pointValueHuf: Number(stored.pointValueHuf ?? defaultLoyaltySettings.pointValueHuf),
    maxRedeemPercent: Number(stored.maxRedeemPercent ?? defaultLoyaltySettings.maxRedeemPercent),
  };
}

export async function saveLoyaltySettings(input: Partial<LoyaltySettings>): Promise<LoyaltySettings> {
  const current = await getLoyaltySettings();
  const next: LoyaltySettings = {
    ...current,
    ...input,
    enabled: Boolean(input.enabled ?? current.enabled),
    earnOnDelivered: Boolean(input.earnOnDelivered ?? current.earnOnDelivered),
    earnDivisor: Math.max(1, Number(input.earnDivisor ?? current.earnDivisor)),
    pointValueHuf: Math.max(1, Number(input.pointValueHuf ?? current.pointValueHuf)),
    maxRedeemPercent: Math.min(100, Math.max(0, Number(input.maxRedeemPercent ?? current.maxRedeemPercent))),
  };
  await writeJsonFile(LOYALTY_SETTINGS_FILE, next);
  return next;
}
