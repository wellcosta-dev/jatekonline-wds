import { readJsonFile, writeJsonFile } from "@/lib/server/storage";

const AUTH_LIMIT_FILE = "auth-rate-limit.json";
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const LOCK_MS = 20 * 60 * 1000;
const ADMIN_MAX_ATTEMPTS = 5;
const ADMIN_LOCK_MS = 30 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

type Entry = {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
  lastAttemptAt: number;
};

type Store = {
  lastCleanupAt?: number;
  byKey: Record<string, Entry>;
};

function normalizeIp(ipInput: string | null): string {
  const raw = String(ipInput ?? "").trim();
  if (!raw) return "unknown";
  return raw.split(",")[0].trim();
}

function normalizeEmail(emailInput: string): string {
  return String(emailInput || "").trim().toLowerCase();
}

function key(ip: string, email: string, scope: "customer" | "admin"): string {
  return `${scope}|${normalizeIp(ip)}|${normalizeEmail(email)}`;
}

function secondsRemaining(until: number): number {
  return Math.max(1, Math.ceil((until - Date.now()) / 1000));
}

export async function getAuthAttemptInfo(
  ip: string | null,
  emailInput: string,
  scope: "customer" | "admin" = "customer"
) {
  const store = await readJsonFile<Store>(AUTH_LIMIT_FILE, { byKey: {} });
  const record = store.byKey[key(ip ?? "", emailInput, scope)];
  if (!record?.lockedUntil || record.lockedUntil <= Date.now()) {
    return { blocked: false as const, retryAfterSeconds: 0 };
  }
  return {
    blocked: true as const,
    retryAfterSeconds: secondsRemaining(record.lockedUntil),
  };
}

export async function clearAuthAttempts(
  ip: string | null,
  emailInput: string,
  scope: "customer" | "admin" = "customer"
) {
  const store = await readJsonFile<Store>(AUTH_LIMIT_FILE, { byKey: {} });
  delete store.byKey[key(ip ?? "", emailInput, scope)];
  await writeJsonFile(AUTH_LIMIT_FILE, store);
}

export async function registerAuthFailure(
  ip: string | null,
  emailInput: string,
  scope: "customer" | "admin" = "customer"
) {
  const now = Date.now();
  const store = await readJsonFile<Store>(AUTH_LIMIT_FILE, { byKey: {} });
  const entryKey = key(ip ?? "", emailInput, scope);
  const current = store.byKey[entryKey];
  const maxAttempts = scope === "admin" ? ADMIN_MAX_ATTEMPTS : MAX_ATTEMPTS;
  const lockMs = scope === "admin" ? ADMIN_LOCK_MS : LOCK_MS;

  let next: Entry;
  if (!current || now - current.firstAttemptAt > WINDOW_MS) {
    next = {
      attempts: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
    };
  } else {
    const attempts = current.attempts + 1;
    next = {
      ...current,
      attempts,
      lastAttemptAt: now,
      lockedUntil: attempts >= maxAttempts ? now + lockMs : current.lockedUntil,
    };
  }
  store.byKey[entryKey] = next;

  const shouldCleanup =
    !store.lastCleanupAt || now - store.lastCleanupAt > CLEANUP_INTERVAL_MS;
  if (shouldCleanup) {
    for (const [k, entry] of Object.entries(store.byKey)) {
      const expiredLock = entry.lockedUntil ? entry.lockedUntil < now : true;
      const staleAttempts = now - entry.lastAttemptAt > CLEANUP_INTERVAL_MS;
      if (expiredLock && staleAttempts) {
        delete store.byKey[k];
      }
    }
    store.lastCleanupAt = now;
  }

  await writeJsonFile(AUTH_LIMIT_FILE, store);

  if (next.lockedUntil && next.lockedUntil > now) {
    return { blocked: true as const, retryAfterSeconds: secondsRemaining(next.lockedUntil) };
  }
  return { blocked: false as const, retryAfterSeconds: 0 };
}
