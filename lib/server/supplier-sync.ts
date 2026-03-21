import { readJsonFile, writeJsonFile } from "@/lib/server/storage";
import { getEffectiveProductById, getEffectiveProducts, updateProductById } from "@/lib/server/products";
import type { Product } from "@/types";

const SUPPLIER_SYNC_STATUS_FILE = "supplier-sync-status.json";
const AUTO_RUN_INTERVAL_MS = 24 * 60 * 60 * 1000;
const AUTO_CHECK_MIN_INTERVAL_MS = 5 * 60 * 1000;
const RUNNING_STALE_AFTER_MS = 8 * 60 * 1000;
const SUPPLIER_FETCH_TIMEOUT_MS = 45_000;
const DEFAULT_TEST_LIMIT = 3;

type SyncMode = "test" | "full" | "single";
type SyncInitiator = "admin" | "cron" | "auto";

type SupplierSyncStatus = {
  running: boolean;
  lastStartedAt?: string;
  lastProgressAt?: string;
  lastFinishedAt?: string;
  lastSuccessAt?: string;
  lastMode?: SyncMode;
  lastInitiator?: SyncInitiator;
  lastError?: string;
  lastSummary?: SupplierSyncSummary;
};

type SupplierSyncOptions = {
  mode: SyncMode;
  initiatedBy: SyncInitiator;
  limit?: number;
  productId?: string;
};

export type SupplierSyncProductResult = {
  productId: string;
  productName: string;
  supplierUrl?: string;
  ok: boolean;
  updated: boolean;
  reason?: string;
  parsedSku?: string;
  expectedSku?: string;
  purchasePrice?: number;
  inStock?: boolean;
};

export type SupplierSyncSummary = {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  mode: SyncMode;
  initiatedBy: SyncInitiator;
  attemptedCount: number;
  successCount: number;
  updatedCount: number;
  failedCount: number;
  skippedCount: number;
  sampleSize: number;
  lowMarginCount: number;
  results: SupplierSyncProductResult[];
};

type CookieJar = {
  cookies: Map<string, string>;
};

let runningPromise: Promise<SupplierSyncSummary> | null = null;
let lastAutoCheckMs = 0;

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeSku(value?: string): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function toSupplierSkuCandidate(internalSku?: string): string {
  const raw = String(internalSku ?? "").trim();
  if (!raw) return "";
  const tail = raw.includes("-") ? raw.split("-").at(-1) ?? raw : raw;
  return normalizeSku(tail);
}

function parsePriceToNumber(raw: string): number | undefined {
  const cleaned = raw.replace(/[^\d,.\s]/g, "").trim();
  if (!cleaned) return undefined;
  const normalized = cleaned
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

function sanitizePriceCandidates(values: string[]): number[] {
  return values
    .map((raw) => parsePriceToNumber(raw))
    .filter((value): value is number => value !== undefined && value >= 100);
}

function extractSkuFromHtml(html: string): string | undefined {
  const skuClassMatch = html.match(/artdet__sku-value[^>]*>\s*([^<\s]+)\s*</i);
  if (skuClassMatch?.[1]) return skuClassMatch[1].trim();

  const genericSkuMatch = html.match(/Cikksz[aá]m[\s\S]{0,180}?>([^<\s]{3,})</i);
  if (genericSkuMatch?.[1]) return genericSkuMatch[1].trim();
  return undefined;
}

function extractPriceFromHtml(html: string): number | undefined {
  const jsonPriceCandidates = sanitizePriceCandidates(
    Array.from(
      html.matchAll(/"price"\s*:\s*"?(?:HUF\s*)?([0-9][0-9.,]{1,10})"?/gi),
      (match) => match[1]
    )
  );
  if (jsonPriceCandidates.length > 0) {
    return Math.min(...jsonPriceCandidates);
  }

  const metaPrice =
    html.match(/itemprop=["']price["'][^>]*content=["']([^"']+)["']/i)?.[1] ??
    html.match(/content=["']([^"']+)["'][^>]*itemprop=["']price["']/i)?.[1];
  if (metaPrice) {
    const value = parsePriceToNumber(metaPrice);
    if (value !== undefined) return value;
  }

  const dataPrice = html.match(/data-price=["']([^"']+)["']/i)?.[1];
  if (dataPrice) {
    const value = parsePriceToNumber(dataPrice);
    if (value !== undefined) return value;
  }

  const ftPrice = html.match(/([0-9][0-9.\s]{1,15})\s*Ft/i)?.[1];
  if (ftPrice) {
    const value = parsePriceToNumber(ftPrice);
    if (value !== undefined && value >= 100) return value;
  }

  return undefined;
}

function extractInStockFromHtml(html: string): boolean | undefined {
  const source = html.toLowerCase();
  const negativePatterns = [
    "nincs raktáron",
    "elfogyott",
    "nem rendelhető",
    "jelenleg nem elérhető",
    "out of stock",
  ];
  if (negativePatterns.some((token) => source.includes(token))) return false;

  const positivePatterns = [
    "raktáron",
    "készleten",
    "elérhető",
    "azonnal szállítható",
    "in stock",
  ];
  if (positivePatterns.some((token) => source.includes(token))) return true;

  return undefined;
}

function isLikelyLoginPage(url: string, html: string): boolean {
  const source = html.toLowerCase();
  if (/login|bejelent|belepes|fiók|account/i.test(url)) return true;
  return source.includes("type=\"password\"") && /bejelent|login|jelszó/i.test(source);
}

function extractLoginForm(html: string): {
  action: string;
  method: "GET" | "POST";
  fields: Record<string, string>;
  emailField: string;
  passwordField: string;
} | null {
  const forms = html.match(/<form[\s\S]*?<\/form>/gi) ?? [];
  for (const formHtml of forms) {
    const action = formHtml.match(/action=["']([^"']+)["']/i)?.[1] ?? "";
    const method = (formHtml.match(/method=["']([^"']+)["']/i)?.[1] ?? "POST").toUpperCase();

    const fields: Record<string, string> = {};
    const inputRegex = /<input[^>]*>/gi;
    let inputMatch: RegExpExecArray | null = null;
    let emailField = "";
    let passwordField = "";

    while ((inputMatch = inputRegex.exec(formHtml)) !== null) {
      const input = inputMatch[0];
      const name = input.match(/name=["']([^"']+)["']/i)?.[1]?.trim();
      if (!name) continue;
      const value = input.match(/value=["']([^"']*)["']/i)?.[1] ?? "";
      const type = (input.match(/type=["']([^"']+)["']/i)?.[1] ?? "text").toLowerCase();
      fields[name] = value;

      if (!emailField && (type === "email" || /email|felhasz|user/i.test(name))) {
        emailField = name;
      }
      if (!passwordField && (type === "password" || /pass|jelsz/i.test(name))) {
        passwordField = name;
      }
    }

    if (!emailField || !passwordField) continue;
    return {
      action,
      method: method === "GET" ? "GET" : "POST",
      fields,
      emailField,
      passwordField,
    };
  }
  return null;
}

function createCookieJar(): CookieJar {
  return { cookies: new Map<string, string>() };
}

function getCookieHeader(jar: CookieJar): string {
  return Array.from(jar.cookies.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function setCookiesFromResponse(jar: CookieJar, response: Response) {
  const responseHeaders = response.headers as unknown as {
    getSetCookie?: () => string[];
    get?: (name: string) => string | null;
  };
  const rawCookies =
    (typeof responseHeaders.getSetCookie === "function"
      ? responseHeaders.getSetCookie()
      : undefined) ??
    [];
  const fallback = responseHeaders.get?.("set-cookie");
  const allCookies = rawCookies.length > 0 ? rawCookies : fallback ? [fallback] : [];

  for (const raw of allCookies) {
    const pair = raw.split(";")[0]?.trim();
    if (!pair || !pair.includes("=")) continue;
    const [name, ...valueParts] = pair.split("=");
    if (!name) continue;
    jar.cookies.set(name.trim(), valueParts.join("=").trim());
  }
}

async function fetchHtml(url: string, jar: CookieJar, method: "GET" | "POST" = "GET", body?: string) {
  const response = await fetch(url, {
    method,
    headers: {
      "user-agent": "BabyOnlineSupplierSync/1.0",
      accept: "text/html,application/xhtml+xml",
      ...(getCookieHeader(jar) ? { cookie: getCookieHeader(jar) } : {}),
      ...(body ? { "content-type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(SUPPLIER_FETCH_TIMEOUT_MS),
  });
  setCookiesFromResponse(jar, response);
  const html = await response.text();
  return { response, html };
}

async function maybeAuthenticateAndFetchProduct(url: string): Promise<{ html: string; finalUrl: string }> {
  const jar = createCookieJar();
  const email = process.env.SUPPLIER_LOGIN_EMAIL?.trim();
  const password = process.env.SUPPLIER_LOGIN_PASSWORD?.trim();

  const initial = await fetchHtml(url, jar);
  const initialSku = extractSkuFromHtml(initial.html);
  const loginConfigured = Boolean(email && password);

  if (loginConfigured) {
    try {
      const home = await fetchHtml("https://www.astibababolt.hu/", jar);
      const loginForm = extractLoginForm(home.html) ?? extractLoginForm(initial.html);
      if (loginForm) {
        const loginUrl = new URL(
          loginForm.action || "https://www.astibababolt.hu/shop_logincheck.php",
          home.response.url
        ).toString();
        const fields = { ...loginForm.fields };
        fields[loginForm.emailField] = email as string;
        fields[loginForm.passwordField] = password as string;
        const loginBody = new URLSearchParams(fields).toString();
        await fetchHtml(loginUrl, jar, loginForm.method, loginBody);
        const afterLogin = await fetchHtml(url, jar);
        if (extractSkuFromHtml(afterLogin.html)) {
          return { html: afterLogin.html, finalUrl: afterLogin.response.url };
        }
      }
    } catch {
      // Fall back to public product HTML below.
    }
  }

  if (initialSku) {
    return { html: initial.html, finalUrl: initial.response.url };
  }

  if (isLikelyLoginPage(initial.response.url, initial.html) && !loginConfigured) {
    throw new Error("A beszállítói oldal bejelentkezést kér, de SUPPLIER_LOGIN_EMAIL/PASSWORD nincs beállítva.");
  }

  if (isLikelyLoginPage(initial.response.url, initial.html) && loginConfigured) {
    throw new Error("A beszállítói bejelentkezés után sem sikerült a termékoldal SKU azonosítása.");
  }

  return { html: initial.html, finalUrl: initial.response.url };
}

function computeMarginPercent(product: Product): number | undefined {
  if (!Number.isFinite(product.purchasePrice) || !Number.isFinite(product.price) || product.price <= 0) {
    return undefined;
  }
  const profit = product.price - (product.purchasePrice ?? 0);
  return (profit / product.price) * 100;
}

async function loadStatus(): Promise<SupplierSyncStatus> {
  const status = await readJsonFile<SupplierSyncStatus>(SUPPLIER_SYNC_STATUS_FILE, {
    running: false,
  });
  if (!status.running) return status;

  if (runningPromise) return status;

  const progressAtMs = status.lastProgressAt
    ? new Date(status.lastProgressAt).getTime()
    : status.lastStartedAt
      ? new Date(status.lastStartedAt).getTime()
      : 0;
  const nowMs = Date.now();
  const isStale =
    !Number.isFinite(progressAtMs) ||
    progressAtMs <= 0 ||
    nowMs - progressAtMs > RUNNING_STALE_AFTER_MS;

  if (!isStale) return status;

  const healed: SupplierSyncStatus = {
    ...status,
    running: false,
    lastFinishedAt: nowIso(),
    lastError:
      status.lastError ??
      "Az előző beszállítói szinkron megszakadt, a futási zár automatikusan feloldva.",
  };
  await saveStatus(healed);
  return healed;
}

async function saveStatus(status: SupplierSyncStatus): Promise<void> {
  await writeJsonFile(SUPPLIER_SYNC_STATUS_FILE, status);
}

function makeSummaryFromError(
  options: SupplierSyncOptions,
  startedAt: string,
  message: string
): SupplierSyncSummary {
  const finishedAt = nowIso();
  return {
    startedAt,
    finishedAt,
    durationMs: new Date(finishedAt).getTime() - new Date(startedAt).getTime(),
    mode: options.mode,
    initiatedBy: options.initiatedBy,
    attemptedCount: 0,
    successCount: 0,
    updatedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    sampleSize: 0,
    lowMarginCount: 0,
    results: [
      {
        productId: "system",
        productName: "Supplier sync",
        ok: false,
        updated: false,
        reason: message,
      },
    ],
  };
}

export async function getSupplierSyncStatus(): Promise<SupplierSyncStatus> {
  return loadStatus();
}

export async function runSupplierSync(options: SupplierSyncOptions): Promise<SupplierSyncSummary> {
  if (runningPromise) return runningPromise;

  const startedAt = nowIso();
  runningPromise = (async () => {
    const initialStatus = await loadStatus();
    await saveStatus({
      ...initialStatus,
      running: true,
      lastStartedAt: startedAt,
      lastProgressAt: startedAt,
      lastMode: options.mode,
      lastInitiator: options.initiatedBy,
      lastError: undefined,
    });

    try {
      const allProducts = await getEffectiveProducts();
      let candidateProducts = allProducts.filter(
        (product) => Boolean(product.supplierUrl?.trim()) && Boolean(product.sku?.trim())
      );

      if (options.mode === "single") {
        const single = options.productId ? await getEffectiveProductById(options.productId) : undefined;
        candidateProducts = single ? [single] : [];
      } else if (options.mode === "test") {
        const requested = Math.max(1, Math.floor(Number(options.limit ?? DEFAULT_TEST_LIMIT)));
        candidateProducts = candidateProducts.slice(0, requested);
      } else if (options.limit && options.limit > 0) {
        candidateProducts = candidateProducts.slice(0, Math.floor(options.limit));
      }

      const results: SupplierSyncProductResult[] = [];

      for (const product of candidateProducts) {
        const statusBeforeProduct = await loadStatus();
        await saveStatus({
          ...statusBeforeProduct,
          running: true,
          lastProgressAt: nowIso(),
          lastMode: options.mode,
          lastInitiator: options.initiatedBy,
        });
        const supplierUrl = product.supplierUrl?.trim();
        if (!supplierUrl) {
          results.push({
            productId: product.id,
            productName: product.name,
            ok: false,
            updated: false,
            reason: "Hiányzó beszállítói link",
          });
          continue;
        }

        try {
          const fetched = await maybeAuthenticateAndFetchProduct(supplierUrl);
          const parsedSkuRaw = extractSkuFromHtml(fetched.html);
          const parsedSku = normalizeSku(parsedSkuRaw);
          const expectedSku = toSupplierSkuCandidate(product.sku);
          if (!parsedSku || !expectedSku || parsedSku !== expectedSku) {
            await updateProductById(product.id, { stock: 0 });
            results.push({
              productId: product.id,
              productName: product.name,
              supplierUrl: fetched.finalUrl,
              ok: false,
              updated: true,
              parsedSku: parsedSkuRaw,
              expectedSku,
              reason: "Cikkszám eltérés vagy átirányított beszállítói oldal",
            });
            continue;
          }

          const inStock = extractInStockFromHtml(fetched.html) === true;
          const purchasePrice = extractPriceFromHtml(fetched.html);
          const patch: Record<string, unknown> = {
            stock: inStock ? 10 : 0,
          };
          if (purchasePrice !== undefined) patch.purchasePrice = purchasePrice;

          await updateProductById(product.id, patch);
          results.push({
            productId: product.id,
            productName: product.name,
            supplierUrl: fetched.finalUrl,
            ok: true,
            updated: true,
            parsedSku: parsedSkuRaw,
            expectedSku,
            purchasePrice,
            inStock,
          });
        } catch (error) {
          await updateProductById(product.id, { stock: 0 });
          results.push({
            productId: product.id,
            productName: product.name,
            supplierUrl,
            ok: false,
            updated: true,
            reason: error instanceof Error ? error.message : "Beszállítói lekérés sikertelen",
          });
        }
      }

      const refreshedProducts = await getEffectiveProducts();
      const lowMarginCount = refreshedProducts.filter((product) => {
        const margin = computeMarginPercent(product);
        return margin !== undefined && margin < 8;
      }).length;

      const finishedAt = nowIso();
      const summary: SupplierSyncSummary = {
        startedAt,
        finishedAt,
        durationMs: new Date(finishedAt).getTime() - new Date(startedAt).getTime(),
        mode: options.mode,
        initiatedBy: options.initiatedBy,
        attemptedCount: candidateProducts.length,
        successCount: results.filter((entry) => entry.ok).length,
        updatedCount: results.filter((entry) => entry.updated).length,
        failedCount: results.filter((entry) => !entry.ok).length,
        skippedCount: results.filter((entry) => !entry.updated).length,
        sampleSize: candidateProducts.length,
        lowMarginCount,
        results,
      };
      const firstFailureReason = results.find((entry) => !entry.ok)?.reason;

      const statusBeforeSave = await loadStatus();
      await saveStatus({
        ...statusBeforeSave,
        running: false,
        lastProgressAt: finishedAt,
        lastFinishedAt: finishedAt,
        lastSuccessAt: finishedAt,
        lastMode: options.mode,
        lastInitiator: options.initiatedBy,
        lastSummary: summary,
        lastError: firstFailureReason,
      });

      return summary;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Beszállítói szinkron sikertelen";
      const summary = makeSummaryFromError(options, startedAt, message);
      const statusBeforeSave = await loadStatus();
      await saveStatus({
        ...statusBeforeSave,
        running: false,
        lastProgressAt: summary.finishedAt,
        lastFinishedAt: summary.finishedAt,
        lastMode: options.mode,
        lastInitiator: options.initiatedBy,
        lastSummary: summary,
        lastError: message,
      });
      return summary;
    } finally {
      runningPromise = null;
    }
  })();

  return runningPromise;
}

export async function maybeTriggerAutomaticSupplierSync(): Promise<void> {
  const enabled = process.env.SUPPLIER_SYNC_AUTO_DAILY !== "false";
  if (!enabled) return;
  if (runningPromise) return;

  const nowMs = Date.now();
  if (nowMs - lastAutoCheckMs < AUTO_CHECK_MIN_INTERVAL_MS) return;
  lastAutoCheckMs = nowMs;

  const status = await loadStatus();
  const lastSuccessMs = status.lastSuccessAt ? new Date(status.lastSuccessAt).getTime() : 0;
  if (lastSuccessMs > 0 && nowMs - lastSuccessMs < AUTO_RUN_INTERVAL_MS) return;

  void runSupplierSync({
    mode: "full",
    initiatedBy: "auto",
  }).catch((error) => {
    console.error("Automatic supplier sync failed:", error);
  });
}
