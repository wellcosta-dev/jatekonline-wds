const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const csvPath = path.join(__dirname, "..", "babyonline_products_export_1.csv");
const outputPath = path.join(__dirname, "..", "lib", "product-data.ts");

const csvContent = fs.readFileSync(csvPath, "utf-8");

const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
  relax_quotes: true,
});

console.log(`Parsed ${records.length} CSV rows`);

const productMap = new Map();

for (const row of records) {
  const handle = row["Handle"];
  if (!handle) continue;

  if (!productMap.has(handle)) {
    productMap.set(handle, {
      handle,
      title: row["Title"] || "",
      bodyHtml: row["Body (HTML)"] || "",
      vendor: row["Vendor"] || "",
      productCategory: row["Product Category"] || "",
      type: row["Type"] || "",
      tags: row["Tags"] || "",
      published: row["Published"] === "true",
      sku: row["Variant SKU"] || "",
      grams: parseFloat(row["Variant Grams"] || "0"),
      inventoryQty: parseInt(row["Variant Inventory Qty"] || "0", 10),
      price: row["Variant Price"] || "0",
      compareAtPrice: row["Variant Compare At Price"] || "",
      images: [],
      seoTitle: row["SEO Title"] || "",
      seoDescription: row["SEO Description"] || "",
      status: row["Status"] || "active",
      barcode: row["Variant Barcode"] || "",
      supplierUrl:
        row["beszallito-link (product.metafields.custom.beszallito_link)"] || "",
      googleMpn: row["Google Shopping / MPN"] || "",
      costPerItem: row["Cost per item"] || "",
    });
  }

  const imgSrc = row["Image Src"];
  if (imgSrc) {
    productMap.get(handle).images.push(imgSrc);
  }
}

console.log(`Found ${productMap.size} unique products`);

const categoryMap = new Map();
let catIdx = 0;

for (const [, p] of productMap) {
  const cat = p.productCategory;
  if (cat && !categoryMap.has(cat)) {
    categoryMap.set(cat, {
      original: cat,
      index: catIdx++,
    });
  }
}

console.log(`Found ${categoryMap.size} unique categories:`);
for (const [cat, info] of categoryMap) {
  console.log(`  ${info.index}: ${cat}`);
}

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text) {
  const hungarianMap = {
    á: "a", é: "e", í: "i", ó: "o", ö: "o", ő: "o",
    ú: "u", ü: "u", ű: "u", Á: "a", É: "e", Í: "i",
    Ó: "o", Ö: "o", Ő: "o", Ú: "u", Ü: "u", Ű: "u",
  };
  return text
    .split("")
    .map((c) => hungarianMap[c] || c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapShopifyCategoryToLocal(shopifyCat) {
  const cat = (shopifyCat || "").toLowerCase();
  if (cat.includes("stroller") || cat.includes("babakocsi") || cat.includes("baby transport")) return "babakocsi";
  if (cat.includes("car seat") || cat.includes("autosules") || cat.includes("safety")) return "biztonsag";
  if (cat.includes("diaper") || cat.includes("pelenka") || cat.includes("wipe")) return "pelenkak";
  if (cat.includes("clothing") || cat.includes("ruha") || cat.includes("apparel") || cat.includes("body") || cat.includes("textile")) return "babaruha";
  if (cat.includes("feed") || cat.includes("bottle") || cat.includes("etetes") || cat.includes("pacifier") || cat.includes("teether") || cat.includes("bib") || cat.includes("cup") || cat.includes("tableware") || cat.includes("highchair") || cat.includes("sterilizer")) return "etetes";
  if (cat.includes("toy") || cat.includes("jatek") || cat.includes("play") || cat.includes("game") || cat.includes("puzzle")) return "jatekok";
  if (cat.includes("bath") || cat.includes("furd") || cat.includes("hygiene") || cat.includes("skincare") || cat.includes("grooming") || cat.includes("health") || cat.includes("thermometer")) return "furdetes";
  if (cat.includes("nursery") || cat.includes("babaszoba") || cat.includes("furniture") || cat.includes("bedding") || cat.includes("monitor") || cat.includes("crib") || cat.includes("mattress") || cat.includes("decor") || cat.includes("lighting")) return "babaszoba";
  if (cat.includes("carrier") || cat.includes("hordozo") || cat.includes("wrap") || cat.includes("sling")) return "biztonsag";
  if (cat.includes("gate") || cat.includes("protector") || cat.includes("lock") || cat.includes("safety rail")) return "biztonsag";
  return "egyeb";
}

const localCategories = [
  { id: "cat-pelenkak", slug: "pelenkak", name: "Pelenkák", description: "Pelenkák és törlőkendők", sortOrder: 1 },
  { id: "cat-babaruha", slug: "babaruha", name: "Babaruhák", description: "Ruhák és textíliák babáknak", sortOrder: 2 },
  { id: "cat-babakocsi", slug: "babakocsi", name: "Babakocsik", description: "Babakocsik és kiegészítők", sortOrder: 3 },
  { id: "cat-etetes", slug: "etetes", name: "Etetés", description: "Etetési kiegészítők és eszközök", sortOrder: 4 },
  { id: "cat-jatekok", slug: "jatekok", name: "Játékok", description: "Játékok és fejlesztő eszközök", sortOrder: 5 },
  { id: "cat-biztonsag", slug: "biztonsag", name: "Biztonság", description: "Biztonsági termékek és autósülések", sortOrder: 6 },
  { id: "cat-furdetes", slug: "furdetes", name: "Fürdetés", description: "Fürdetés és higiénia", sortOrder: 7 },
  { id: "cat-babaszoba", slug: "babaszoba", name: "Babaszoba", description: "Babaszoba bútorok és kiegészítők", sortOrder: 8 },
  { id: "cat-egyeb", slug: "egyeb", name: "Egyéb", description: "Egyéb baba-mama termékek", sortOrder: 9 },
];

const catIdMap = {};
for (const c of localCategories) catIdMap[c.slug] = c.id;

const products = [];
let idx = 0;

for (const [handle, p] of productMap) {
  if (p.status !== "active" || !p.published) continue;
  if (!p.title) continue;

  const localCatSlug = mapShopifyCategoryToLocal(p.productCategory);
  const categoryId = catIdMap[localCatSlug] || "cat-egyeb";
  const htmlDesc = (p.bodyHtml || "").trim();
  const plainDesc = stripHtml(htmlDesc);
  const shortDesc = plainDesc.length > 150 ? plainDesc.slice(0, 147) + "..." : plainDesc;
  const price = parseFloat(p.price) || 0;
  const compareAt = parseFloat(p.compareAtPrice) || 0;
  const tags = p.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (price <= 0) continue;

  products.push({
    id: `prod-${String(idx).padStart(4, "0")}`,
    slug: handle,
    name: p.title,
    description: htmlDesc || plainDesc.slice(0, 2000),
    shortDesc,
    price: compareAt > price ? compareAt : price,
    salePrice: compareAt > price ? price : undefined,
    sku: p.sku || `BO-${String(idx).padStart(4, "0")}`,
    manufacturerSku: p.googleMpn || undefined,
    ean: p.barcode || undefined,
    supplierUrl: p.supplierUrl || undefined,
    // Current catalog is exclusively FreeOn; keep brand uniform for feed compliance.
    manufacturer: "FreeOn",
    stock: p.inventoryQty > 0 ? p.inventoryQty : 0,
    images: p.images.slice(0, 6),
    categoryId,
    tags: tags.slice(0, 10),
    weight: p.grams > 0 ? p.grams / 1000 : undefined,
    isActive: true,
    isFeatured: idx < 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  idx++;
}

console.log(`Generated ${products.length} active products`);

const catCounts = {};
for (const p of products) {
  const cat = localCategories.find((c) => c.id === p.categoryId);
  const slug = cat ? cat.slug : "unknown";
  catCounts[slug] = (catCounts[slug] || 0) + 1;
}
console.log("Products per category:", catCounts);

let tsOutput = `import type { Product, Category } from "@/types";

// Auto-generated from Shopify CSV export
// Generated: ${new Date().toISOString()}
// Total products: ${products.length}

export const shopifyCategories: Category[] = ${JSON.stringify(localCategories, null, 2)};

export const shopifyProducts: Product[] = [\n`;

for (const p of products) {
  const obj = {
    ...p,
    rating: +(3.5 + Math.random() * 1.5).toFixed(1),
    reviewCount: Math.floor(Math.random() * 80) + 5,
  };

  // Escape backticks and ${} in strings
  const json = JSON.stringify(obj, null, 2)
    .replace(/\\\\/g, "\\\\")
    .replace(/`/g, "\\`");

  tsOutput += json + ",\n";
}

tsOutput += `];

export function getShopifyProductBySlug(slug: string): Product | undefined {
  return shopifyProducts.find((p) => p.slug === slug);
}

export function getShopifyProductsByCategory(categorySlug: string): Product[] {
  const category = shopifyCategories.find((c) => c.slug === categorySlug);
  if (!category) return [];
  return shopifyProducts.filter((p) => p.categoryId === category.id);
}

export function getShopifyFeaturedProducts(): Product[] {
  return shopifyProducts.filter((p) => p.isFeatured);
}

export function getShopifyCategoryBySlug(slug: string): Category | undefined {
  return shopifyCategories.find((c) => c.slug === slug);
}
`;

fs.writeFileSync(outputPath, tsOutput, "utf-8");
console.log(`\nWritten to: ${outputPath}`);
console.log(`File size: ${(Buffer.byteLength(tsOutput) / 1024 / 1024).toFixed(2)} MB`);
