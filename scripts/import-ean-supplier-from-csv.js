const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const csvPath = path.join(__dirname, "..", "babyonline_products_export_1.csv");
const overridesPath = path.join(__dirname, "..", "data", "product-overrides.json");

function clean(value) {
  return String(value ?? "").trim();
}

function hasValue(value) {
  return clean(value).length > 0;
}

function loadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

const csvContent = fs.readFileSync(csvPath, "utf-8");
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
  relax_quotes: true,
});

const byHandle = new Map();
for (const row of records) {
  const handle = clean(row["Handle"]);
  if (!handle) continue;

  const current = byHandle.get(handle) || { ean: "", supplierUrl: "" };
  const nextEan = clean(row["Variant Barcode"]);
  const nextSupplierUrl = clean(
    row["beszallito-link (product.metafields.custom.beszallito_link)"]
  );

  byHandle.set(handle, {
    ean: hasValue(current.ean) ? current.ean : nextEan,
    supplierUrl: hasValue(current.supplierUrl) ? current.supplierUrl : nextSupplierUrl,
  });
}

const overrides = loadJson(overridesPath, {});
let touchedProducts = 0;
let eanUpdated = 0;
let supplierUpdated = 0;

for (const [id, product] of Object.entries(overrides)) {
  const handle = clean(product.slug);
  if (!handle || !byHandle.has(handle)) continue;
  const source = byHandle.get(handle);

  let changed = false;
  const nextProduct = { ...product };

  if (!hasValue(nextProduct.ean) && hasValue(source.ean)) {
    nextProduct.ean = source.ean;
    eanUpdated += 1;
    changed = true;
  }
  if (!hasValue(nextProduct.supplierUrl) && hasValue(source.supplierUrl)) {
    nextProduct.supplierUrl = source.supplierUrl;
    supplierUpdated += 1;
    changed = true;
  }
  if (!hasValue(nextProduct.manufacturer)) {
    nextProduct.manufacturer = "FreeOn";
    changed = true;
  }

  if (changed) {
    nextProduct.updatedAt = new Date().toISOString();
    overrides[id] = nextProduct;
    touchedProducts += 1;
  }
}

fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2), "utf-8");

console.log(`CSV rows parsed: ${records.length}`);
console.log(`Unique handles: ${byHandle.size}`);
console.log(`Products updated: ${touchedProducts}`);
console.log(` - EAN updated: ${eanUpdated}`);
console.log(` - Supplier URL updated: ${supplierUpdated}`);
