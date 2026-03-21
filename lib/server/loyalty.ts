import type { LoyaltyBalance } from "@/types";
import { readJsonFile, writeJsonFile } from "@/lib/server/storage";

const LOYALTY_BALANCES_FILE = "loyalty-balances.json";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function getAllBalances(): Promise<Record<string, LoyaltyBalance>> {
  return readJsonFile<Record<string, LoyaltyBalance>>(LOYALTY_BALANCES_FILE, {});
}

async function saveAllBalances(balances: Record<string, LoyaltyBalance>): Promise<void> {
  await writeJsonFile(LOYALTY_BALANCES_FILE, balances);
}

export async function getLoyaltyBalance(email: string): Promise<LoyaltyBalance> {
  const normalized = normalizeEmail(email);
  const all = await getAllBalances();
  const existing = all[normalized];
  if (existing) return existing;
  return {
    email: normalized,
    points: 0,
    lifetimeEarned: 0,
    lifetimeRedeemed: 0,
    updatedAt: new Date().toISOString(),
  };
}

export async function redeemLoyaltyPoints(email: string, points: number): Promise<void> {
  if (points <= 0) return;
  const normalized = normalizeEmail(email);
  const all = await getAllBalances();
  const current =
    all[normalized] ??
    ({
      email: normalized,
      points: 0,
      lifetimeEarned: 0,
      lifetimeRedeemed: 0,
      updatedAt: new Date().toISOString(),
    } as LoyaltyBalance);

  if (current.points < points) {
    throw new Error("Nincs elegendő Babapont.");
  }

  const next: LoyaltyBalance = {
    ...current,
    points: current.points - points,
    lifetimeRedeemed: current.lifetimeRedeemed + points,
    updatedAt: new Date().toISOString(),
  };
  all[normalized] = next;
  await saveAllBalances(all);
}

export async function awardLoyaltyPoints(email: string, points: number): Promise<void> {
  if (points <= 0) return;
  const normalized = normalizeEmail(email);
  const all = await getAllBalances();
  const current =
    all[normalized] ??
    ({
      email: normalized,
      points: 0,
      lifetimeEarned: 0,
      lifetimeRedeemed: 0,
      updatedAt: new Date().toISOString(),
    } as LoyaltyBalance);

  const next: LoyaltyBalance = {
    ...current,
    points: current.points + points,
    lifetimeEarned: current.lifetimeEarned + points,
    updatedAt: new Date().toISOString(),
  };
  all[normalized] = next;
  await saveAllBalances(all);
}
