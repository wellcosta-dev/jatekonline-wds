/**
 * Mintavételezés: Regio termékoldalak — miért nem talál Product JSON-LD-t a scraper?
 * Futtatás: node scripts/diagnose-regio-ldjson.mjs
 */
const BASE = "https://www.regiojatek.hu";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,*/*" } });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
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

function parseBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((x) => x[1]);
}

function hasProductInBlocks(blocks, parseFn) {
  for (const raw of blocks) {
    const data = parseFn(raw);
    if (data && pickProductFromJson(data)) return true;
  }
  return false;
}

function firstBlockParseError(raw) {
  try {
    JSON.parse(String(raw).trim());
    return null;
  } catch (e) {
    return String(e.message).slice(0, 140);
  }
}

function extractListingPaths(html) {
  const out = new Set();
  const re = /href="(https?:\/\/www\.regiojatek\.hu\/)?(termek-\d+-[^"]+\.html)"/gi;
  let m;
  while ((m = re.exec(html))) {
    const p = m[2].replace(/&amp;/g, "&");
    if (!/^termek-\d+-.+\.html$/i.test(p)) continue;
    if (p.toLowerCase().includes("lego")) continue;
    out.add(p);
  }
  return [...out];
}

const listingUrl = `${BASE}/index.php?action=webstore&ws_action=view_cat&category_id=202&name_hash=tarsasjatek-kartya&pg=1`;

const listRes = await fetchText(listingUrl);
console.log("Lista oldal HTTP:", listRes.status, listRes.ok ? "OK" : "FAIL");

const paths = extractListingPaths(listRes.text).slice(0, 40);
console.log("Mintavétel termékek száma:", paths.length);

let httpFail = 0;
let strictProduct = 0;
let lenientProduct = 0;
const failSamples = [];

for (const path of paths) {
  const url = `${BASE}/${path}`;
  const r = await fetchText(url);
  if (!r.ok) {
    httpFail++;
    if (failSamples.length < 5) failSamples.push({ path, reason: `HTTP ${r.status}` });
    continue;
  }
  const blocks = parseBlocks(r.text);
  const strict = hasProductInBlocks(blocks, (raw) => {
    try {
      return JSON.parse(String(raw).trim());
    } catch {
      return null;
    }
  });
  const lenient = hasProductInBlocks(blocks, tryParseLdJson);
  if (strict) strictProduct++;
  if (lenient) lenientProduct++;
  if (!lenient && failSamples.length < 6) {
    const err0 = blocks[0] ? firstBlockParseError(blocks[0]) : "nincs blokk";
    failSamples.push({
      path,
      firstBlockStrictError: err0,
      titleMatch: r.text.match(/<title>([^<]{0,120})/i)?.[1],
    });
  }
  await new Promise((x) => setTimeout(x, 80));
}

console.log("\n--- Összegzés ---");
console.log("HTTP hiba:", httpFail);
console.log("Product JSON-LD (strict JSON.parse, régi scraper viselkedés):", strictProduct);
console.log("Product JSON-LD (tryParseLdJson — vezérlőkarakterek szóközzé):", lenientProduct);

console.log(
  "\nMagyarázat: sok oldalon az első ld+json blokk a Product, de a leírásban nyers sortörés van → strict parse elszáll → a scraper korábban 'hiba'."
);

console.log("\n--- Minták: lenient sem talált Productot (ritka) ---");
for (const s of failSamples) {
  if (s.firstBlockStrictError) {
    console.log("\n", s.path);
    console.log("  strict 1. blokk hiba:", s.firstBlockStrictError);
    if (s.titleMatch) console.log("  title:", s.titleMatch.trim());
  }
}
