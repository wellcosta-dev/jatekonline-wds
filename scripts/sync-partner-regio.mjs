/**
 * partner.regiojatek.hu — beszállítói link, partner ár (AJAX), készlet szabály:
 * - Van készlet a megadott üzletben (alap: Nyíregyháza store_id=27) a stores_with_stock listában → stock = IN_STOCK_CAP
 * - Egyébként stock = 0 (előrendelhető a bolt logikája szerint)
 *
 * Készlet HTML: alapból www.regiojatek.hu + ugyanaz a termék path (mint a partner supplierUrl).
 * A nyilvános oldalon a btn-show-stores csak megnyitja a modalban ugyanazt a <script id="stores_with_stock"> blokkot;
 * a partner termékoldal gyakran SOAP timeout / hiba HTML (stores_with_stock nélkül).
 *
 * Belépés: PARTNER_REGIO_EMAIL + PARTNER_REGIO_PASSWORD (vagy .env.partner a projekt gyökérben — .gitignore alatt).
 *
 * Futtatás:
 *   npm run partner:sync
 *   npm run partner:sync -- --limit=100
 *   npm run partner:sync -- --dry-run
 *   npm run partner:sync -- --stock-only       — csak készlet (www HTML), árak érintetlenek (SOAP timeout esetén)
 *   npm run partner:sync -- --progress-lines   — görgethető soronkénti haladás
 *
 * Env opcionális:
 *   PARTNER_BASE=https://partner.regiojatek.hu
 *   PARTNER_STOCK_HTML_ORIGIN=https://www.regiojatek.hu   — készlet script forrása (path egyezik a partnerrel)
 *   PARTNER_NYIREGYHAZA_STORE_ID=27
 *   PRICE_BATCH_SIZE=40
 *   FETCH_CONCURRENCY=3
 *   FETCH_DELAY_MS=90
 *   PARTNER_PROGRESS_EVERY=10   — termék HTML: ennyi kész termék után frissül a sor
 *   PARTNER_PROGRESS_LINES=1    — minden frissítés új sorba (görgethető napló)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseStoresWithStock } from "./regio-stores-parse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CATALOG_PATH = path.join(ROOT, "data", "regio-catalog.json");
const META_PATH = path.join(ROOT, "data", "partner-sync.meta.json");

const BASE = (process.env.PARTNER_BASE || "https://partner.regiojatek.hu").replace(/\/$/, "");
const STOCK_HTML_ORIGIN = (
  process.env.PARTNER_STOCK_HTML_ORIGIN || "https://www.regiojatek.hu"
).replace(/\/$/, "");
const NY_STORE_ID = String(process.env.PARTNER_NYIREGYHAZA_STORE_ID || "27");
const PRICE_BATCH = Math.max(5, Math.min(80, Number(process.env.PRICE_BATCH_SIZE || 40)));
const CONCURRENCY = Math.max(1, Math.min(8, Number(process.env.FETCH_CONCURRENCY || 3)));
const FETCH_DELAY_MS = Math.max(0, Number(process.env.FETCH_DELAY_MS || 90));
/** Ha van készlet Nyíregyházán, ezt írjuk stocknak (a pontos db a partner oldalon nincs a HTML-ben). */
const IN_STOCK_CAP = Math.max(1, Math.min(999, Number(process.env.PARTNER_IN_STOCK_CAP || 99)));
const PROGRESS_EVERY = Math.max(1, Math.min(500, Number(process.env.PARTNER_PROGRESS_EVERY || 10)));

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function loadEnvPartner() {
  const p = path.join(ROOT, ".env.partner");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvPartner();

const jar = new Map();

function mergeCookies(setCookie) {
  if (!setCookie) return;
  const list = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const line of list) {
    const part = String(line).split(";")[0];
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    jar.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
  }
}

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fmtDuration(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "?";
  if (sec < 90) return `${Math.round(sec)} mp`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m < 60) return `${m} p ${s} mp`;
  const h = Math.floor(m / 60);
  return `${h} ó ${m % 60} p`;
}

async function fetchPartner(url, opts = {}) {
  const headers = {
    "User-Agent": UA,
    Accept: opts.accept || "text/html,*/*",
    "Accept-Language": "hu-HU,hu;q=0.9",
    ...opts.headers,
  };
  const c = cookieHeader();
  if (c) headers.Cookie = c;
  const res = await fetch(url, { ...opts, headers, redirect: "manual" });
  const sc = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  if (sc.length) mergeCookies(sc);
  return res;
}

async function followRedirects(firstRes, max = 12) {
  let res = firstRes;
  let url = res.url;
  for (let n = 0; n < max && res.status >= 300 && res.status < 400; n++) {
    const loc = res.headers.get("location");
    if (!loc) break;
    url = new URL(loc, url).href;
    res = await fetchPartner(url, { method: "GET" });
  }
  const text = await res.text();
  return { res, url, text };
}

async function loginPartner(email, password) {
  let r = await fetchPartner(`${BASE}/`, { method: "GET" });
  await followRedirects(r);
  r = await fetchPartner(`${BASE}/index.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: `${BASE}/`,
    },
    body: new URLSearchParams({ cmd: "login", email, password }).toString(),
  });
  const after = await followRedirects(r);
  const ok =
    after.res.ok &&
    (/kijelentkez/i.test(after.text) || /login=true/i.test(after.url)) &&
    !/must-login/i.test(after.text);
  if (!ok) {
    throw new Error("Partner bejelentkezés sikertelen (ellenőrizd az e-mailt / jelszót).");
  }
}

function regioCodeFromProduct(p) {
  const sku = String(p.sku || "");
  const m = sku.match(/^RIO-(\d+)$/i);
  if (m) return m[1];
  const ms = String(p.manufacturerSku || "").replace(/\D/g, "");
  if (ms) return ms.padStart(5, "0");
  return null;
}

function partnerPathFromSupplierUrl(supplierUrl) {
  if (!supplierUrl) return null;
  try {
    const u = new URL(supplierUrl);
    return u.pathname.startsWith("/") ? u.pathname : `/${u.pathname}`;
  } catch {
    return null;
  }
}

function partnerProductUrl(pathname) {
  if (!pathname) return null;
  return `${BASE}${pathname}`;
}

function publicStockPageUrl(pathname) {
  if (!pathname) return null;
  return `${STOCK_HTML_ORIGIN}${pathname}`;
}

/** Hiba / login / SOAP timeout oldal — nincs értelmezhető készlet script */
function stockHtmlLooksBroken(html) {
  if (!html || html.length < 500) return true;
  if (/action=soap_error|soap_error|must-login/i.test(html)) return true;
  return !html.includes("stores_with_stock");
}

async function fetchStockListingHtml(url) {
  const headers = {
    "User-Agent": UA,
    Accept: "text/html,*/*",
    "Accept-Language": "hu-HU,hu;q=0.9",
    Referer: `${STOCK_HTML_ORIGIN}/`,
  };
  const res = await fetch(url, { method: "GET", headers, redirect: "follow" });
  const text = await res.text();
  return { res, text };
}

function nyiregyhazaInStock(stores) {
  if (!Array.isArray(stores)) return false;
  return stores.some((x) => String(x?.store_id) === NY_STORE_ID);
}

function parseHuPrice(val) {
  if (val == null) return null;
  const n = Math.round(Number(String(val).replace(/\s/g, "").replace(",", ".")));
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function fetchPriceBatch(codes) {
  const params = new URLSearchParams();
  params.set("action", "webstore");
  params.set("ws_action", "get_ajax_prices");
  for (const c of codes) params.append("product_nos[]", c);
  const url = `${BASE}/index.php?${params.toString()}`;
  const res = await fetchPartner(url, {
    method: "GET",
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${BASE}/`,
    },
  });
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("location") || "";
    throw new Error(
      `get_ajax_prices HTTP ${res.status} → ${loc.slice(0, 120)} (gyakori: partner SOAP timeout)`
    );
  }
  const txt = await res.text();
  if (!res.ok) throw new Error(`get_ajax_prices HTTP ${res.status}`);
  try {
    return JSON.parse(txt);
  } catch {
    throw new Error(`get_ajax_prices nem JSON: ${txt.slice(0, 120)}`);
  }
}

async function mapPool(items, concurrency, fn, progress) {
  let next = 0;
  let finished = 0;
  const total = items.length;
  const t0 = progress?.every > 0 ? Date.now() : 0;
  const results = new Array(items.length);
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i], i);
      finished++;
      if (progress?.every > 0) {
        const hit =
          finished === 1 ||
          finished % progress.every === 0 ||
          finished === total;
        if (hit) {
          const elapsed = (Date.now() - t0) / 1000;
          const pct = total ? ((100 * finished) / total).toFixed(1) : "100";
          const rate = elapsed > 0 ? finished / elapsed : 0;
          const left = total - finished;
          const etaSec = rate > 0 ? left / rate : NaN;
          const etaStr = Number.isFinite(etaSec) ? fmtDuration(etaSec) : "…";
          const line = `${progress.label}${finished}/${total} (${pct}%) | ${rate.toFixed(2)} lap/s | eltelt ${fmtDuration(elapsed)} | hátra ~${etaStr}`;
          if (progress.useLines) {
            console.log(" ", line);
          } else {
            process.stdout.write(`\r  ${line.padEnd(88, " ")}`);
          }
        }
      }
      if (FETCH_DELAY_MS) await sleep(FETCH_DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  if (progress?.every > 0 && !progress.useLines) console.log("");
  return results;
}

function parseArgs() {
  const dryRun = process.argv.includes("--dry-run");
  const stockOnly = process.argv.includes("--stock-only");
  const progressLines =
    process.argv.includes("--progress-lines") || process.env.PARTNER_PROGRESS_LINES === "1";
  let limit = 0;
  for (const a of process.argv) {
    if (a.startsWith("--limit=")) limit = Math.max(0, Number(a.slice(8)) || 0);
  }
  return { dryRun, limit, progressLines, stockOnly };
}

async function main() {
  const { dryRun, limit, progressLines, stockOnly } = parseArgs();

  const email = process.env.PARTNER_REGIO_EMAIL;
  const password = process.env.PARTNER_REGIO_PASSWORD;
  if (!stockOnly && (!email || !password)) {
    console.error(
      "Állítsd be PARTNER_REGIO_EMAIL és PARTNER_REGIO_PASSWORD környezeti változókat, vagy hozz létre .env.partner fájlt a projekt gyökérben."
    );
    process.exit(1);
  }
  if (limit > 0) {
    console.warn(
      `FIGYELEM: --limit=${limit} — csak az első ${limit} termék frissül; a többi változatlan marad. Éleshez futtasd limit nélkül.`
    );
  }

  if (!fs.existsSync(CATALOG_PATH)) {
    console.error("Hiányzik:", CATALOG_PATH);
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const products = Array.isArray(catalog.products) ? catalog.products : [];
  const slice = limit > 0 ? products.slice(0, limit) : products;

  if (stockOnly) {
    console.log("Csak készlet mód: partner bejelentkezés kihagyva, árak nem frissülnek.");
  } else {
    console.log("Partner bejelentkezés…", BASE);
    await loginPartner(email, password);
  }
  console.log("OK. Termékek:", slice.length, dryRun ? "(dry-run)" : "", stockOnly ? "(stock-only)" : "");

  /** @type {string[]} */
  const codes = [];
  /** @type {Map<string, typeof products[0]>} */
  const byCode = new Map();
  for (const p of slice) {
    const code = regioCodeFromProduct(p);
    if (!code) continue;
    if (!byCode.has(code)) {
      byCode.set(code, p);
      codes.push(code);
    }
  }
  /** @type {Record<string, number | null>} */
  const priceByCode = {};
  if (!stockOnly) {
    const priceT0 = Date.now();
    console.log("Árak lekérése (get_ajax_prices), batch:", PRICE_BATCH);
    for (let i = 0; i < codes.length; i += PRICE_BATCH) {
      const batch = codes.slice(i, i + PRICE_BATCH);
      const json = await fetchPriceBatch(batch);
      for (const c of batch) {
        priceByCode[c] = parseHuPrice(json[c]);
      }
      await sleep(80);
      const done = Math.min(i + PRICE_BATCH, codes.length);
      const pct = codes.length ? ((100 * done) / codes.length).toFixed(1) : "100";
      const elapsed = (Date.now() - priceT0) / 1000;
      console.log(`  [árak] ${done}/${codes.length} (${pct}%) | eltelt ${fmtDuration(elapsed)}`);
    }
  }

  const tasks = codes.map((code) => {
    const p = byCode.get(code);
    const path = partnerPathFromSupplierUrl(p?.supplierUrl);
    return {
      code,
      p,
      path,
      stockUrl: path ? publicStockPageUrl(path) : null,
    };
  });

  let htmlErrors = 0;
  let nyiStock = 0;

  if (!dryRun) {
    const estMin = Math.ceil((tasks.length * FETCH_DELAY_MS) / CONCURRENCY / 60000);
    console.log(
      "Készlet (stores_with_stock) HTML:",
      STOCK_HTML_ORIGIN,
      "| párhuzamosság:",
      CONCURRENCY,
      `— kb. ${tasks.length} kérés, becsült idő ~${estMin}–${Math.ceil(estMin * 1.5)} perc (késleltetés + hálózat).`
    );
    const results = await mapPool(
      tasks,
      CONCURRENCY,
      async (t) => {
        if (!t.stockUrl) {
          return { code: t.code, stores: null, http: 0 };
        }
        try {
          const { res, text } = await fetchStockListingHtml(t.stockUrl);
          if (!res.ok) return { code: t.code, stores: null, http: res.status };
          if (stockHtmlLooksBroken(text)) {
            return { code: t.code, stores: null, http: res.status };
          }
          const stores = parseStoresWithStock(text);
          return { code: t.code, stores, http: res.status };
        } catch {
          return { code: t.code, stores: null, http: -1 };
        }
      },
      {
        every: PROGRESS_EVERY,
        label: "[termék HTML] ",
        useLines: progressLines,
      }
    );

    /** @type {Map<string, boolean>} */
    const nyiByCode = new Map();
    for (const r of results) {
      if (r.stores === null) {
        htmlErrors++;
        nyiByCode.set(r.code, false);
      } else {
        const has = nyiregyhazaInStock(r.stores);
        nyiByCode.set(r.code, has);
        if (has) nyiStock++;
      }
    }

    for (const p of slice) {
      const code = regioCodeFromProduct(p);
      if (!code) continue;
      const path = partnerPathFromSupplierUrl(p.supplierUrl);
      if (path) {
        p.supplierUrl = partnerProductUrl(path);
      }
      const pp = priceByCode[code];
      if (!stockOnly && pp != null) p.purchasePrice = pp;
      const atNyi = nyiByCode.get(code);
      if (atNyi === true) p.stock = IN_STOCK_CAP;
      else p.stock = 0;
      p.updatedAt = new Date().toISOString();
      const attrs = p.attributes && typeof p.attributes === "object" ? { ...p.attributes } : {};
      attrs["Beszállító (Regio partner)"] = "partner.regiojatek.hu";
      attrs["Nyíregyháza készlet (store_id)"] = NY_STORE_ID;
      p.attributes = attrs;
    }

    catalog.generatedAt = new Date().toISOString();
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog));
    fs.writeFileSync(
      META_PATH,
      JSON.stringify(
        {
          generatedAt: catalog.generatedAt,
          source: BASE,
          stockHtmlOrigin: STOCK_HTML_ORIGIN,
          nyiregyhazaStoreId: NY_STORE_ID,
          inStockCap: IN_STOCK_CAP,
          productCount: slice.length,
          uniqueCodes: codes.length,
          priceFilled: stockOnly
            ? null
            : Object.values(priceByCode).filter((x) => x != null).length,
          stockOnly: stockOnly || undefined,
          nyiregyhazaInStockCount: nyiStock,
          htmlFetchIssues: htmlErrors,
        },
        null,
        2
      )
    );
    console.log("Kész. Frissítve:", CATALOG_PATH);
    console.log("Meta:", META_PATH);
    console.log("Nyíregyházi készleten (becsült):", nyiStock, "| HTML hiba / üres parse:", htmlErrors);
  } else {
    console.log("Dry-run: első 3 kód ára:", codes.slice(0, 3).map((c) => [c, priceByCode[c]]));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
