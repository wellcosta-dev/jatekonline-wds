/**
 * Gyors minta: fő kategóriák + max ~200 termék → data/regio-catalog.json
 * (a bolt a lib/product-data.ts-en keresztül importálja a JSON-t).
 *
 * Run: npm run catalog:regio
 *
 * Teljes katalógus (LEGO nélkül, kategóriánként): npm run catalog:regio-full
 *
 * Megjegyzés: kereskedelmi használat előtt ellenőrizd a szöveg/kép jogosultságát és a forrás oldal feltételeit.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_JSON = path.join(ROOT, "data", "regio-catalog.json");
const OUT_META = path.join(ROOT, "data", "regio-catalog.meta.json");

const BASE = "https://www.regiojatek.hu";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const TARGET_PRODUCTS = 200;
/** Collect extra listing URLs — many list rows are incomplete; we need a buffer. */
const TARGET_PATHS = 520;
const LIST_DELAY_MS = 350;
const PRODUCT_DELAY_MS = 250;

/** Top-level categories aligned with regiojatek.hu/kategoriak.html (fő kategóriák) */
const REGIO_TOP_CATEGORIES = [
  { regioId: 59, slugPart: "ajandek", name: "Ajándék", description: "Ajándékötletek és dísztárgyak" },
  { regioId: 195, slugPart: "auto_jarmu", name: "Autó, jármű", description: "Járművek, pályák és kiegészítők" },
  { regioId: 205, slugPart: "baba_babakocsi", name: "Baba, babakocsi", description: "Babák, babaházak és játék babakocsik" },
  { regioId: 203, slugPart: "bebijatek_kellek", name: "Bébijáték, kellék", description: "Bébijátékok és kellékek" },
  { regioId: 219, slugPart: "diavetito_diafilm", name: "Diavetítő, diafilm", description: "Diavetítők és diafilmek" },
  { regioId: 210, slugPart: "divat_ekszer_smink", name: "Divat, ékszer, smink", description: "Divat és kreatív kiegészítők" },
  { regioId: 215, slugPart: "elektronikus_jatek", name: "Elektronikus játék", description: "Elektronikus és digitális játékok" },
  { regioId: 201, slugPart: "epitojatek", name: "Építőjáték", description: "Építőjátékok" },
  { regioId: 221, slugPart: "elem", name: "Elem", description: "Elemek és tartozékok" },
  { regioId: 68, slugPart: "fajatek", name: "Fajáték", description: "Fából készült játékok" },
  { regioId: 218, slugPart: "iskolaszer", name: "Iskolaszer", description: "Iskolai és írószerek" },
  { regioId: 197, slugPart: "jatekfegyver_kard", name: "Játékfegyver, kard", description: "Játék fegyverek, kardok, pajzsok" },
  { regioId: 196, slugPart: "jatekfigura", name: "Játékfigura", description: "Figurák és szettek" },
  { regioId: 200, slugPart: "jelmez_kiegeszitok", name: "Jelmez, kiegészítők", description: "Jelmezek és kiegészítők" },
  { regioId: 324, slugPart: "kisallat_jatek", name: "Kisállat játék", description: "Kisállat játékok" },
  { regioId: 216, slugPart: "konyv_kifesto", name: "Könyv, kifestő", description: "Könyvek és kifestők" },
  { regioId: 208, slugPart: "kreativ_fejleszto", name: "Kreatív, fejlesztő", description: "Kreatív és fejlesztő játékok" },
  { regioId: 125, slugPart: "lego", name: "LEGO", description: "LEGO építőjátékok" },
  { regioId: 214, slugPart: "party_kellekek", name: "Party kellékek", description: "Party és ünnepi kellékek" },
  { regioId: 212, slugPart: "playmobil", name: "Playmobil", description: "Playmobil játékok" },
  { regioId: 29, slugPart: "pluss", name: "Plüss", description: "Plüssfigurák és textil játékok" },
  { regioId: 220, slugPart: "pos", name: "POS", description: "POS és dekoráció" },
  { regioId: 213, slugPart: "puzzle_kirako", name: "Puzzle, kirakó", description: "Puzzle és kirakós játékok" },
  { regioId: 206, slugPart: "sportszer_labda", name: "Sportszer, labda", description: "Sporteszközök és labdák" },
  { regioId: 211, slugPart: "strandjatek_medence", name: "Strandjáték, medence", description: "Strand és vízi játékok" },
  { regioId: 204, slugPart: "szabadteri_jatek", name: "Szabadtéri játék", description: "Kerti és szabadtéri játékok" },
  { regioId: 199, slugPart: "szerepjatek", name: "Szerepjáték", description: "Szerepjátékok és szettek" },
  { regioId: 202, slugPart: "tarsasjatek_kartya", name: "Társasjáték, kártya", description: "Társasjátékok és kártyák" },
  { regioId: 209, slugPart: "zenelo_jatek_hangszer", name: "Zenélő játék, hangszer", description: "Hangszerek és zenélő játékok" },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function toSlugSegment(slugPart) {
  return slugPart.replace(/_/g, "-");
}

function nameHashFromSlugPart(slugPart) {
  return slugPart.replace(/_/g, "-");
}

function categoryIdFor(regioId) {
  return `cat-r${regioId}`;
}

function decodeHtmlEntities(s) {
  if (!s) return "";
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,*/*" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

function listingUrl(regioId, slugPart, page) {
  const hash = nameHashFromSlugPart(slugPart);
  return `${BASE}/index.php?action=webstore&ws_action=view_cat&category_id=${regioId}&name_hash=${encodeURIComponent(hash)}&pg=${page}`;
}

function isValidProductPath(p) {
  return (
    /^termek-\d+-.+\.html$/i.test(p) &&
    !p.includes("termek-lista") &&
    p.length > 22
  );
}

function extractProductPaths(html) {
  const out = new Set();
  const re = /href="(https?:\/\/www\.regiojatek\.hu\/)?(termek-\d+-[^"]+\.html)"/gi;
  let m;
  while ((m = re.exec(html))) {
    const p = m[2].replace(/&amp;/g, "&");
    if (!isValidProductPath(p)) continue;
    out.add(p);
  }
  return [...out];
}

function maxListingPage(html) {
  const pages = [...html.matchAll(/pg=(\d+)/g)].map((x) => Number(x[1]));
  return pages.length ? Math.max(...pages) : 1;
}

function pickProductFromJson(data) {
  if (!data) return null;
  const t = data["@type"];
  if (t === "Product" || (Array.isArray(t) && t.includes("Product"))) return data;
  if (Array.isArray(data)) {
    for (const item of data) {
      const p = pickProductFromJson(item);
      if (p) return p;
    }
  }
  if (data["@graph"] && Array.isArray(data["@graph"])) {
    for (const item of data["@graph"]) {
      const p = pickProductFromJson(item);
      if (p) return p;
    }
  }
  return null;
}

/** Lásd scrape-regio-full-catalog.mjs — Regio gyakran érvénytelen JSON-LD-t ad (nyers sortörés a szövegben). */
function tryParseLdJson(raw) {
  const s = String(raw).trim();
  try {
    return JSON.parse(s);
  } catch {
    try {
      return JSON.parse(s.replace(/[\u0000-\u001F\u007F]/g, " "));
    } catch {
      return null;
    }
  }
}

function parseProductJsonLd(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((x) => x[1]);
  for (const raw of blocks) {
    const data = tryParseLdJson(raw);
    if (!data) continue;
    const product = pickProductFromJson(data);
    if (product) return product;
  }
  return null;
}

function parseProductUrl(pathOrUrl) {
  const path = pathOrUrl.replace(/^https?:\/\/www\.regiojatek\.hu\//, "");
  const m = path.match(/^termek-(\d+)-(.+)\.html$/i);
  if (!m) return null;
  return { code: m[1], slug: m[2] };
}

const CATEGORIES_FOR_SHOP = REGIO_TOP_CATEGORIES.filter((c) => c.regioId !== 125);

function normalizeCatalogSlug(slugPart, code) {
  let slug = String(slugPart)
    .toLowerCase()
    .replace(/[^a-z0-9-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) slug = `termek-${code}`;
  return slug;
}

function filterImages(images) {
  const base = BASE.replace(/\/$/, "");
  return (images || [])
    .map((u) => String(u).trim())
    .filter((u) => u && u !== base && u !== `${base}/`);
}

function buildCategoryRecords() {
  return CATEGORIES_FOR_SHOP.map((c, i) => ({
    id: categoryIdFor(c.regioId),
    slug: toSlugSegment(c.slugPart),
    name: c.name,
    description: c.description,
    sortOrder: i + 1,
  }));
}

/** Ugyanaz az azonosító séma, mint a catalog:regio-full szkriptnél (prod-r + RIO-) */
function detailToCatalogProduct(detail, idx) {
  const code = detail.code;
  const slug = normalizeCatalogSlug(detail.slug, code);
  const categoryId = detail.categoryId;
  const description = detail.descriptionHtml || `<p>${String(detail.name).replace(/</g, "")}</p>`;
  const shortDesc = (detail.shortDesc || detail.name).slice(0, 400);
  const images = filterImages(detail.images);
  const salePrice =
    detail.salePrice != null && detail.salePrice < detail.price ? detail.salePrice : undefined;

  return {
    id: `prod-r${code}`,
    slug,
    name: detail.name,
    description,
    shortDesc,
    manufacturerSku: detail.manufacturerSku,
    ean: detail.ean,
    unitName: "db",
    price: detail.price,
    salePrice,
    sku: `RIO-${code}`,
    stock: detail.stock ?? 0,
    images,
    categoryId,
    categoryIds: [categoryId],
    manufacturer: detail.manufacturer,
    tags: detail.tags || [],
    weight: 1,
    weightUnit: "kg",
    supplierUrl: detail.supplierUrl,
    isActive: true,
    isFeatured: idx < 12,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
  };
}

async function collectProductPaths() {
  /** @type {Map<string, string>} path -> categoryId */
  const assigned = new Map();
  /** @type {Map<number, number>} regioId -> last seen max page from HTML */
  const maxPages = new Map();
  let page = 1;
  const maxRounds = 40;

  while (assigned.size < TARGET_PATHS && page <= maxRounds) {
    let progressed = false;
    for (const cat of CATEGORIES_FOR_SHOP) {
      if (assigned.size >= TARGET_PATHS) break;
      const cid = categoryIdFor(cat.regioId);
      const cap = maxPages.get(cat.regioId) || 999;
      if (page > cap) continue;

      const url = listingUrl(cat.regioId, cat.slugPart, page);
      let html;
      try {
        html = await fetchText(url);
      } catch {
        maxPages.set(cat.regioId, Math.min(cap, page - 1) || 1);
        continue;
      }
      await sleep(LIST_DELAY_MS);
      const mp = maxListingPage(html);
      maxPages.set(cat.regioId, mp);
      progressed = true;

      const paths = extractProductPaths(html);
      for (const p of paths) {
        if (!assigned.has(p)) assigned.set(p, cid);
        if (assigned.size >= TARGET_PATHS) break;
      }
    }
    if (!progressed) break;
    page += 1;
  }

  return assigned;
}

async function fetchProductDetail(path, categoryId) {
  const url = `${BASE}/${path}`;
  const html = await fetchText(url);
  await sleep(PRODUCT_DELAY_MS);
  const parsed = parseProductUrl(path);
  if (!parsed) return null;
  const ld = parseProductJsonLd(html);
  if (!ld) return null;

  const name = String(ld.name || "").replace(/\s*\|\s*REGIO.*$/i, "").trim() || parsed.slug;
  const descRaw = typeof ld.description === "string" ? ld.description : "";
  const descriptionHtml = decodeHtmlEntities(descRaw).trim() || `<p>${name}</p>`;
  const shortDesc = descriptionHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const rawOffer = ld.offers;
  const offer =
    rawOffer && typeof rawOffer === "object"
      ? Array.isArray(rawOffer)
        ? rawOffer[0]
        : rawOffer
      : null;
  const priceStr = offer?.price != null ? String(offer.price) : "";
  const price = priceStr ? Math.round(Number(priceStr.replace(/\s/g, "").replace(",", "."))) : 0;
  const availability = String(offer?.availability || "");
  const inStock = availability.includes("InStock");
  const stock = inStock ? 10 : 0;

  let images = [];
  if (Array.isArray(ld.image)) images = ld.image.map(String);
  else if (typeof ld.image === "string") images = [ld.image];

  const brand = ld.brand;
  const manufacturer =
    typeof brand === "string" ? brand : brand && typeof brand.name === "string" ? brand.name : undefined;

  const manufacturerSku = ld.sku != null ? String(ld.sku).trim() : undefined;
  const ean = ld.gtin13 != null ? String(ld.gtin13) : ld.gtin != null ? String(ld.gtin) : undefined;

  let salePrice;
  const low = ld.offers && !Array.isArray(ld.offers) ? ld.offers.lowPrice : null;
  const high = ld.offers && !Array.isArray(ld.offers) ? ld.offers.highPrice : null;
  if (low != null && high != null) {
    const lo = Math.round(Number(String(low).replace(/\s/g, "")) || 0);
    const hi = Math.round(Number(String(high).replace(/\s/g, "")) || 0);
    if (lo > 0 && hi > 0 && lo < hi) {
      salePrice = lo;
    }
  }

  const now = new Date().toISOString();
  const basePrice = price || 1;
  return {
    code: parsed.code,
    slug: parsed.slug,
    name,
    descriptionHtml,
    shortDesc,
    price: basePrice,
    salePrice: salePrice != null && salePrice < basePrice ? salePrice : undefined,
    manufacturerSku,
    ean,
    stock,
    images,
    manufacturer,
    supplierUrl: url,
    categoryId,
    tags: ld.category ? [String(ld.category)] : [],
    createdAt: now,
    updatedAt: now,
  };
}

async function main() {
  console.log("Collecting listing URLs from regiojatek.hu …");
  const pathToCat = await collectProductPaths();
  console.log("Unique product paths:", pathToCat.size);

  const entries = [...pathToCat.entries()];
  const products = [];
  let i = 0;
  for (const [p, catId] of entries) {
    if (products.length >= TARGET_PRODUCTS) break;
    i += 1;
    process.stdout.write(`\rFetching product ${i} (ok ${products.length}/${TARGET_PRODUCTS}) …`);
    try {
      const detail = await fetchProductDetail(p, catId);
      if (detail) products.push(detail);
    } catch (e) {
      console.error(`\nSkip ${p}:`, e.message);
    }
  }
  console.log("\nParsed products:", products.length);
  if (products.length < TARGET_PRODUCTS) {
    console.warn(`Warning: only ${products.length} products (target ${TARGET_PRODUCTS}). Re-run or increase TARGET_PATHS / maxRounds.`);
  }

  fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });

  const categories = buildCategoryRecords();
  const catalogProducts = products.map((p, idx) => detailToCatalogProduct(p, idx));

  const generatedAt = new Date().toISOString();
  const payload = {
    version: 1,
    generatedAt,
    source: "regiojatek.hu",
    excludes: ["LEGO"],
    note: "Mintakatalógus (catalog:regio). Teljes paletta: npm run catalog:regio-full",
    categories,
    products: catalogProducts,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(payload));
  fs.writeFileSync(
    OUT_META,
    JSON.stringify(
      {
        generatedAt,
        categoryCount: categories.length,
        productCount: catalogProducts.length,
        script: "generate-regio-catalog.mjs",
      },
      null,
      2
    )
  );

  console.log("Wrote", OUT_JSON, `(${catalogProducts.length} termék)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
