/**
 * Teljes regiojatek.hu katalógus (kategória + termék), LEGO nélkül.
 * Kimenet: data/regio-catalog.json (+ meta), közben data/.regio-scrape-checkpoint.json
 *
 * Folyamat: kategóriánként sorban — lista → az adott kategória termékeinek letöltése → checkpoint + JSON mentés.
 * Így leállás után RESUME=1 esetén a kész kategóriák és termékek megmaradnak.
 *
 * Futtatás:
 *   npm run catalog:regio-full
 *
 * Környezeti változók (opcionális):
 *   CONCURRENCY=1     — termék-oldal párhuzamosság egy kategórián belül (alap: 1 = sorban, legbiztonságosabb)
 *   LIST_DELAY_MS     — kategória lista lapok között
 *   FETCH_DELAY_MS    — termék HTML után
 *   SAVE_EVERY        — ennyi termék után is checkpoint (alap 25); kategória végén mindig ment
 *   MAX_PRODUCTS      — teszt (csak ha nem npm catalog:regio-full / nincs --full)
 *   MAX_CATEGORIES      — teszt (ugyanígy)
 *   RESUME=1            — folytatás checkpointból
 *
 * A `npm run catalog:regio-full` és `node ... --full` a teljes katalógust futtatja (MAX_* env figyelmen kívül).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_JSON = path.join(ROOT, "data", "regio-catalog.json");
const OUT_META = path.join(ROOT, "data", "regio-catalog.meta.json");
const CHECKPOINT = path.join(ROOT, "data", ".regio-scrape-checkpoint.json");

const BASE = "https://www.regiojatek.hu";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const npmFullCatalog = process.env.npm_lifecycle_event === "catalog:regio-full";
const argvFull = process.argv.includes("--full");
const forceFullCatalog = npmFullCatalog || argvFull;

const CONCURRENCY = Math.max(1, Math.min(12, Number(process.env.CONCURRENCY || 1)));
const LIST_DELAY_MS = Number(process.env.LIST_DELAY_MS || 120);
const FETCH_DELAY_MS = Number(process.env.FETCH_DELAY_MS || 70);
const SAVE_EVERY = Math.max(1, Number(process.env.SAVE_EVERY || 25));
const MAX_PRODUCTS = forceFullCatalog
  ? 0
  : process.env.MAX_PRODUCTS
    ? Number(process.env.MAX_PRODUCTS)
    : 0;
const RESUME = process.env.RESUME === "1" || process.env.RESUME === "true";

const CHECKPOINT_VERSION = 2;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function categoryIdFor(regioId) {
  return `cat-r${regioId}`;
}

function categoryEndpointKey(ep) {
  return `${ep.regioId}\0${ep.slugPart}`;
}

function toSlugSegment(slugPart) {
  return slugPart.replace(/_/g, "-");
}

function nameHashFromSlugPart(slugPart) {
  return slugPart.replace(/_/g, "-");
}

function listingUrl(regioId, slugPart, page) {
  const hash = nameHashFromSlugPart(slugPart);
  return `${BASE}/index.php?action=webstore&ws_action=view_cat&category_id=${regioId}&name_hash=${encodeURIComponent(hash)}&pg=${page}`;
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

function isLegoCategoryPath(rel) {
  const m = rel.match(/^kat-(\d+)-(.+)\.html$/i);
  if (!m) return false;
  const id = Number(m[1]);
  const slug = m[2].toLowerCase();
  if (id === 125) return true;
  if (slug === "lego") return true;
  if (slug.startsWith("lego_")) return true;
  if (slug.includes("_lego_")) return true;
  if (/^lego[_-]/i.test(slug)) return true;
  if (/_lego$/i.test(slug)) return true;
  if (slug.includes("lego-") && slug.includes("lego")) return true;
  return false;
}

function isLegoProduct(path, ld) {
  const parsed = parseProductUrl(path);
  if (parsed) {
    const s = parsed.slug.toLowerCase();
    const words = s.split("-").filter(Boolean);
    if (words.includes("lego")) return true;
    if (s.startsWith("lego-") || s.endsWith("-lego")) return true;
  }
  const name = String(ld?.name || "").toLowerCase();
  if (/^\s*lego\b/.test(name.trim())) return true;
  const brand = ld?.brand;
  const bname = (typeof brand === "string" ? brand : brand?.name) || "";
  if (String(bname).toUpperCase().includes("LEGO")) return true;
  const cat = String(ld?.category || "").toUpperCase();
  if (cat.includes("LEGO")) return true;
  return false;
}

function isValidProductPath(p) {
  return /^termek-\d+-.+\.html$/i.test(p) && !p.includes("termek-lista") && p.length > 22;
}

function extractProductPaths(html) {
  const out = new Set();
  const re = /href="(https?:\/\/www\.regiojatek\.hu\/)?(termek-\d+-[^"]+\.html)"/gi;
  let m;
  while ((m = re.exec(html))) {
    const p = m[2].replace(/&amp;/g, "&");
    if (!isValidProductPath(p)) continue;
    const parsed = parseProductUrl(p);
    if (parsed && parsed.slug.toLowerCase().split("-").includes("lego")) continue;
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

/**
 * A regiojatek.hu Product JSON-LD-jében gyakoriak nyers sortörések / vezérlőkarakterek a leírásban,
 * ami szabvány szerint érvénytelen JSON — strict JSON.parse elszáll, ezért magas „hiba” arány.
 */
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
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map(
    (x) => x[1]
  );
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

function stripRegioTitle(s) {
  return String(s || "")
    .replace(/\s*\|\s*REGIO.*$/i, "")
    .trim();
}

function stripHtml(s) {
  return String(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html, prop) {
  const re = new RegExp(`property="${prop}" content="([^"]*)"`, "i");
  const m = html.match(re);
  return m ? decodeHtmlEntities(m[1]) : "";
}

function parseCategoryTitle(html) {
  const h1 = html.match(/<h1[^>]*>\s*([^<]+?)\s*</i);
  if (h1) return h1[1].replace(/\s*\(\d+[^)]*\)\s*$/, "").trim();
  const t = html.match(/<title>([^<|]+)/i);
  return t ? stripRegioTitle(t[1]).trim() : "";
}

function humanizeSlugPart(slugPart) {
  return slugPart
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeBrand(brand) {
  if (!brand) return undefined;
  if (typeof brand === "string") return brand.trim() || undefined;
  if (typeof brand.name === "string") return brand.name.trim() || undefined;
  return undefined;
}

function normalizeImages(image) {
  const raw = !image ? [] : Array.isArray(image) ? image.map(String) : [String(image)];
  return raw
    .map((u) => u.trim())
    .filter((u) => {
      if (!u) return false;
      const base = BASE.replace(/\/$/, "");
      if (u === base || u === `${base}/`) return false;
      return true;
    });
}

function offerPriceNum(offer) {
  if (!offer || typeof offer !== "object") return 0;
  const p = offer.price;
  if (p == null) return 0;
  return Math.round(Number(String(p).replace(/\s/g, "").replace(",", ".")) || 0);
}

function normalizeOffer(ld) {
  const raw = ld?.offers;
  if (!raw) return { price: 0, availability: "" };
  const o = Array.isArray(raw) ? raw[0] : raw;
  if (!o || typeof o !== "object") return { price: 0, availability: "" };
  return {
    price: offerPriceNum(o),
    availability: String(o.availability || ""),
  };
}

async function discoverCategoryEndpoints() {
  const html = await fetchText(`${BASE}/kategoriak.html`);
  await sleep(LIST_DELAY_MS);
  const re = /href="(https?:\/\/www\.regiojatek\.hu\/)?(kat-\d+-[^"]+\.html)"/gi;
  const map = new Map();
  let m;
  while ((m = re.exec(html))) {
    const rel = m[2].replace(/&amp;/g, "&");
    if (!/^kat-\d+-.+\.html$/i.test(rel)) continue;
    if (isLegoCategoryPath(rel)) continue;
    const mid = rel.match(/^kat-(\d+)-(.+)\.html$/i);
    if (!mid) continue;
    const regioId = Number(mid[1]);
    const slugPart = mid[2];
    const key = `${regioId}\0${slugPart}`;
    if (!map.has(key)) map.set(key, { regioId, slugPart });
  }
  return [...map.values()];
}

async function mapPool(items, concurrency, fn) {
  let next = 0;
  const results = new Array(items.length);
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

/**
 * Egy kategória összes listázó oldaláról termék-URL-ek (csak ehhez a kategóriához).
 */
async function collectProductPathsForSingleCategory(ep) {
  const cid = categoryIdFor(ep.regioId);
  const paths = new Set();
  let page = 1;
  let maxPage = 1;
  let categoryMeta = null;

  do {
    const url = listingUrl(ep.regioId, ep.slugPart, page);
    let html;
    try {
      html = await fetchText(url);
    } catch {
      break;
    }
    await sleep(LIST_DELAY_MS);
    maxPage = Math.max(maxPage, maxListingPage(html));

    if (!categoryMeta) {
      const title = parseCategoryTitle(html);
      categoryMeta = {
        id: cid,
        slug: toSlugSegment(ep.slugPart),
        name: title || humanizeSlugPart(ep.slugPart),
        description: title ? `${title} — játék webshop` : humanizeSlugPart(ep.slugPart),
        sortOrder: 0,
      };
    }

    for (const p of extractProductPaths(html)) {
      paths.add(p);
    }
    page += 1;
  } while (page <= maxPage);

  return { paths: [...paths], categoryMeta };
}

function mergeCategoryIntoProduct(rec, cid) {
  const ids = rec.categoryIds && rec.categoryIds.length ? [...rec.categoryIds] : [rec.categoryId];
  if (!ids.includes(cid)) ids.push(cid);
  rec.categoryIds = ids;
  rec.categoryId = ids[0];
  rec.updatedAt = new Date().toISOString();
}

function categoryIdsUsedByProducts(productList) {
  const used = new Set();
  for (const p of productList) {
    const ids = p.categoryIds && p.categoryIds.length ? p.categoryIds : [p.categoryId];
    for (const id of ids) if (id) used.add(id);
  }
  return used;
}

/** Csak olyan kategóriák a bolt JSON-ba, amelyhez van legalább egy termék (pl. LEGO-szűrt üres Regio oldalak kiesnek). */
function sortCategoriesForExport(categoryById, products) {
  const used = categoryIdsUsedByProducts(products);
  const categories = [...categoryById.values()]
    .filter((c) => used.has(c.id))
    .sort((a, b) => a.name.localeCompare(b.name, "hu"));
  categories.forEach((c, i) => {
    c.sortOrder = i + 1;
  });
  return categories;
}

function writeOutputs(productById, processedPaths, completedCategoryKeys, categoryById, options = {}) {
  const { stats, writeCheckpoint = true } = options;
  const products = [...productById.values()];
  const categories = sortCategoriesForExport(categoryById, products);

  const checkpoint = {
    version: CHECKPOINT_VERSION,
    products,
    processedPaths: [...processedPaths],
    completedCategoryKeys: [...completedCategoryKeys],
    categoryById: Object.fromEntries(categoryById),
    updatedAt: new Date().toISOString(),
    stats: stats || undefined,
  };
  if (writeCheckpoint) {
    fs.writeFileSync(CHECKPOINT, JSON.stringify(checkpoint));
  }

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: "regiojatek.hu",
    excludes: ["LEGO"],
    categories,
    products,
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload));
  fs.writeFileSync(
    OUT_META,
    JSON.stringify(
      {
        generatedAt: payload.generatedAt,
        categoryCount: categories.length,
        productCount: products.length,
        completedCategories: completedCategoryKeys.length,
        skippedLegoDuringListing: "termék URL-ek a listában LEGO szűrve",
        note:
          "Kategóriánként mentett checkpoint: data/.regio-scrape-checkpoint.json. Beszerzési ár / készlet később partner rendszerből.",
      },
      null,
      2
    )
  );
}

let _slugTail = Promise.resolve();

function allocateSlug(parsed, code, slugRegistry) {
  const run = _slugTail.then(() => {
    let slug = parsed.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug) slug = `termek-${code}`;
    if (slugRegistry.has(slug)) slug = `${slug}-${code}`;
    slugRegistry.add(slug);
    return slug;
  });
  _slugTail = run.catch(() => {});
  return run;
}

async function buildProductRecord(path, html, ld, catIdSet, slugRegistry) {
  const parsed = parseProductUrl(path);
  if (!parsed) return null;

  const code = parsed.code;
  const slug = await allocateSlug(parsed, code, slugRegistry);

  const catIds = [...catIdSet];
  const categoryId = catIds[0] || "cat-r59";
  const categoryIds = catIds.length ? catIds : [categoryId];

  const name = stripRegioTitle(String(ld.name || "")) || humanizeSlugPart(parsed.slug.replace(/-/g, "_"));

  const descRaw = typeof ld.description === "string" ? ld.description : "";
  const description = decodeHtmlEntities(descRaw).trim() || `<p>${name.replace(/</g, "")}</p>`;
  const shortDesc = stripHtml(description).slice(0, 400);

  const offer = normalizeOffer(ld);
  let price = offer.price || 1;
  const availability = offer.availability;
  const inStock = availability.includes("InStock");
  const stock = inStock ? 10 : 0;

  let salePrice;
  const low = ld.offers && !Array.isArray(ld.offers) ? ld.offers.lowPrice : null;
  const high = ld.offers && !Array.isArray(ld.offers) ? ld.offers.highPrice : null;
  if (low != null && high != null) {
    const lo = Math.round(Number(String(low).replace(/\s/g, "")) || 0);
    const hi = Math.round(Number(String(high).replace(/\s/g, "")) || 0);
    if (lo > 0 && hi > 0 && lo < hi) {
      price = hi;
      salePrice = lo;
    }
  }

  const images = normalizeImages(ld.image);
  const manufacturer = normalizeBrand(ld.brand);
  const manufacturerSku = ld.sku != null ? String(ld.sku).trim() : undefined;
  const sku = `RIO-${code}`;
  const ean =
    ld.gtin13 != null
      ? String(ld.gtin13)
      : ld.gtin != null
        ? String(ld.gtin)
        : ld.gtin14 != null
          ? String(ld.gtin14)
          : ld.gtin12 != null
            ? String(ld.gtin12)
            : undefined;

  const ag = ld.aggregateRating;
  let rating;
  let reviewCount;
  if (ag && typeof ag === "object") {
    if (ag.ratingValue != null) rating = Math.min(5, Math.max(0, Number(ag.ratingValue)));
    if (ag.reviewCount != null) reviewCount = Math.max(0, Math.floor(Number(ag.reviewCount)));
  }

  const attributes = {};
  if (ld.category) attributes["Regio (schema) kategória"] = String(ld.category);
  if (ld.sku) attributes["Gyártói cikkszám (Regio)"] = String(ld.sku);
  if (ld.mpn) attributes["MPN"] = String(ld.mpn);
  if (ld.color) attributes["Szín"] = String(ld.color);
  if (ld.material) attributes["Anyag"] = String(ld.material);
  if (ld.size) attributes["Méret"] = String(ld.size);
  if (ld.width && ld.height && ld.depth) {
    attributes["Méretek (schema)"] = `${ld.width}×${ld.height}×${ld.depth}`;
  }
  if (Array.isArray(ld.additionalProperty)) {
    for (const ap of ld.additionalProperty) {
      const key = ap.name || ap.propertyID;
      if (key != null && ap.value != null) attributes[String(key)] = String(ap.value);
    }
  }

  let weight;
  if (ld.weight != null) {
    if (typeof ld.weight === "object" && ld.weight.value != null) {
      weight = Number(ld.weight.value);
    } else if (typeof ld.weight === "number") {
      weight = ld.weight;
    }
  }

  const ogTitle = metaContent(html, "og:title");
  const ogDesc = metaContent(html, "og:description");
  const metaTitle = stripRegioTitle(ogTitle) || name;
  const metaDescription = (ogDesc || shortDesc).slice(0, 200);

  const tags = [];
  if (ld.category) tags.push(String(ld.category));

  const now = new Date().toISOString();
  const supplierUrl = `${BASE}/${path}`;

  return {
    id: `prod-r${code}`,
    slug,
    name,
    description,
    shortDesc,
    manufacturerSku,
    ean,
    unitName: "db",
    price,
    salePrice: salePrice != null && salePrice < price ? salePrice : undefined,
    sku,
    stock,
    images,
    categoryId,
    categoryIds,
    manufacturer,
    tags,
    weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
    weightUnit: "kg",
    attributes: Object.keys(attributes).length ? attributes : undefined,
    supplierUrl,
    metaTitle,
    metaDescription,
    isActive: true,
    isFeatured: false,
    rating,
    reviewCount,
    createdAt: now,
    updatedAt: now,
  };
}

async function fetchAndStoreProduct(path, cid, productById, processedPaths, slugRegistry) {
  const parsed = parseProductUrl(path);
  if (!parsed) {
    processedPaths.add(path);
    return { kind: "skip" };
  }
  const id = `prod-r${parsed.code}`;

  if (processedPaths.has(path)) {
    const existing = productById.get(id);
    if (existing) mergeCategoryIntoProduct(existing, cid);
    return { kind: "already" };
  }

  try {
    const html = await fetchText(`${BASE}/${path}`);
    await sleep(FETCH_DELAY_MS);
    const ld = parseProductJsonLd(html);
    if (!ld) {
      /* Ne processedPaths: újrafuttatáskor / RESUME-nál újra megpróbáljuk (pl. JSON-LD javítás után). */
      return { kind: "fail" };
    }
    if (isLegoProduct(path, ld)) {
      processedPaths.add(path);
      return { kind: "lego" };
    }

    const catSet = new Set([cid]);
    const rec = await buildProductRecord(path, html, ld, catSet, slugRegistry);
    if (!rec) {
      return { kind: "fail" };
    }

    const existing = productById.get(id);
    if (existing) {
      mergeCategoryIntoProduct(existing, cid);
      processedPaths.add(path);
      return { kind: "merge" };
    }

    productById.set(id, rec);
    processedPaths.add(path);
    return { kind: "ok" };
  } catch {
    /* Hálózati / HTTP hiba: ne jelöljük feldolgozottnak, hogy RESUME vagy új futás újrapróbálja. */
    return { kind: "fail" };
  }
}

async function main() {
  fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });

  let endpoints = await discoverCategoryEndpoints();
  console.log("Felfedezett kategória-oldalak (LEGO nélkül):", endpoints.length);

  const testMaxCat = forceFullCatalog
    ? 0
    : process.env.MAX_CATEGORIES
      ? Number(process.env.MAX_CATEGORIES)
      : 0;
  if (testMaxCat > 0) endpoints = endpoints.slice(0, testMaxCat);

  if (forceFullCatalog) {
    console.log("Teljes katalógus mód (MAX_CATEGORIES / MAX_PRODUCTS figyelmen kívül).");
  }

  const productById = new Map();
  const processedPaths = new Set();
  const slugRegistry = new Set();
  const categoryById = new Map();
  const completedCategoryKeys = new Set();

  let totalSkippedLego = 0;
  let totalFailed = 0;
  let globalProductCap = MAX_PRODUCTS > 0 ? MAX_PRODUCTS : 0;
  let stoppedEarly = false;

  if (RESUME && fs.existsSync(CHECKPOINT)) {
    try {
      const cp = JSON.parse(fs.readFileSync(CHECKPOINT, "utf8"));
      if (Array.isArray(cp.products)) {
        for (const p of cp.products) {
          if (p?.id) productById.set(p.id, p);
        }
      }
      if (Array.isArray(cp.processedPaths)) for (const p of cp.processedPaths) processedPaths.add(p);
      if (Array.isArray(cp.completedCategoryKeys)) for (const k of cp.completedCategoryKeys) completedCategoryKeys.add(k);
      if (cp.categoryById && typeof cp.categoryById === "object") {
        for (const [kid, c] of Object.entries(cp.categoryById)) {
          categoryById.set(kid, c);
        }
      }
      for (const pr of productById.values()) if (pr?.slug) slugRegistry.add(pr.slug);
      /* Korábbi verzió parse/HTTP hibánál is processedPaths-ra tett URL-t — törlés, ha nincs termékrekord (újrapróbálás JSON-LD javítás után). LEGO: nincs rekord, de később isLego-nál újra feldolgozott lesz a még nyitott kategóriákban. */
      for (const p of [...processedPaths]) {
        const parsed = parseProductUrl(p);
        if (!parsed) continue;
        const id = `prod-r${parsed.code}`;
        if (!productById.has(id)) processedPaths.delete(p);
      }
      console.log(
        "Resume:",
        productById.size,
        "termékrekord,",
        processedPaths.size,
        "feldolgozott URL (takarítás után),",
        completedCategoryKeys.size,
        "kész kategória"
      );
    } catch {
      /* ignore */
    }
  }

  console.log(
    "Kategóriánkénti scrape; termék párhuzamosság:",
    CONCURRENCY,
    "| checkpoint minden kategória után + minden",
    SAVE_EVERY,
    "terméknél."
  );

  for (let ci = 0; ci < endpoints.length; ci++) {
    const ep = endpoints[ci];
    const key = categoryEndpointKey(ep);
    const cid = categoryIdFor(ep.regioId);

    if (completedCategoryKeys.has(key)) {
      console.log(`\n[${ci + 1}/${endpoints.length}] Kihagyva (már kész): ${ep.slugPart.replace(/_/g, " ")}`);
      continue;
    }

    const { paths: categoryPaths, categoryMeta } = await collectProductPathsForSingleCategory(ep);
    categoryById.set(categoryMeta.id, categoryMeta);

    const uniqueInCatalog = productById.size;
    console.log(
      `\n[${ci + 1}/${endpoints.length}] «${categoryMeta.name}» — ebben a kategóriában ${categoryPaths.length} terméklink | katalógusban eddig ${uniqueInCatalog} egyedi termékrekord`
    );

    const toFetch = [...categoryPaths];

    let catDone = 0;
    let catLego = 0;
    let catFail = 0;
    let catNew = 0;
    let sinceSave = 0;

    const runBatch = async (batch) => {
      if (CONCURRENCY <= 1) {
        for (const path of batch) {
          if (globalProductCap > 0 && productById.size >= globalProductCap) break;
          const o = await fetchAndStoreProduct(path, cid, productById, processedPaths, slugRegistry);
          catDone++;
          if (o.kind === "lego") catLego++;
          else if (o.kind === "fail") catFail++;
          else if (o.kind === "ok") catNew++;
          sinceSave++;
          if (sinceSave >= SAVE_EVERY) {
            sinceSave = 0;
            writeOutputs(productById, processedPaths, completedCategoryKeys, categoryById, {
              stats: { totalSkippedLego, totalFailed },
            });
          }
          process.stdout.write(
            `\r    Termék ${catDone}/${batch.length} | új ebben a kat.: ${catNew} | LEGO: ${catLego} | hiba: ${catFail} | össz rekord: ${productById.size}`
          );
        }
        return;
      }

      let start = 0;
      while (start < batch.length) {
        if (globalProductCap > 0 && productById.size >= globalProductCap) break;
        const slice = batch.slice(start, start + CONCURRENCY);
        start += CONCURRENCY;
        const outcomes = await mapPool(slice, CONCURRENCY, async (path) => {
          return fetchAndStoreProduct(path, cid, productById, processedPaths, slugRegistry);
        });
        for (const o of outcomes) {
        catDone++;
        if (o.kind === "lego") catLego++;
        else if (o.kind === "fail") catFail++;
        else if (o.kind === "ok") catNew++;
        sinceSave++;
          if (sinceSave >= SAVE_EVERY) {
            sinceSave = 0;
            writeOutputs(productById, processedPaths, completedCategoryKeys, categoryById, {
              stats: { totalSkippedLego, totalFailed },
            });
          }
        }
        if (globalProductCap > 0 && productById.size >= globalProductCap) break;
        process.stdout.write(
          `\r    Termék ${catDone}/${batch.length} | új ebben a kat.: ${catNew} | LEGO: ${catLego} | hiba: ${catFail} | össz rekord: ${productById.size}`
        );
      }
    };

    await runBatch(toFetch);

    totalSkippedLego += catLego;
    totalFailed += catFail;

    const stoppedMidCategory =
      globalProductCap > 0 && productById.size >= globalProductCap && catDone < toFetch.length;
    if (!stoppedMidCategory) {
      completedCategoryKeys.add(key);
    }

    writeOutputs(productById, processedPaths, completedCategoryKeys, categoryById, {
      stats: { totalSkippedLego, totalFailed },
    });
    console.log(
      stoppedMidCategory
        ? `\n    Checkpoint mentve (kategória félbeszakadva — RESUME=1 folytatja). Befejezett kategóriák: ${completedCategoryKeys.size}/${endpoints.length}`
        : `\n    Kategória elmentve. Befejezett kategóriák: ${completedCategoryKeys.size}/${endpoints.length}`
    );

    if (globalProductCap > 0 && productById.size >= globalProductCap) {
      console.log("MAX_PRODUCTS elérve, leállás (checkpoint megmaradt).");
      stoppedEarly = true;
      break;
    }
  }

  console.log("\nKész. Összes termékrekord:", productById.size);

  writeOutputs(productById, processedPaths, completedCategoryKeys, categoryById, {
    writeCheckpoint: stoppedEarly,
    stats: stoppedEarly ? { totalSkippedLego, totalFailed } : undefined,
  });

  if (!stoppedEarly) {
    try {
      fs.unlinkSync(CHECKPOINT);
    } catch {
      /* ok */
    }
    console.log("Írva:", OUT_JSON, "(checkpoint törölve — teljes futás vége)");
  } else {
    console.log("Írva:", OUT_JSON, "és", CHECKPOINT, "(részleges futás — folytatás: RESUME=1)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
