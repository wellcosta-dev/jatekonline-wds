const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const PROJECT_ROOT = path.join(__dirname, "..");
const PRODUCT_DATA_PATH = path.join(PROJECT_ROOT, "lib", "product-data.ts");
const TARGET_DIR = path.join(PROJECT_ROOT, "public", "images", "products", "shopify");

function sanitizeFileName(input) {
  return input.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function extensionFromContentType(contentType) {
  if (!contentType) return ".jpg";
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("gif")) return ".gif";
  if (contentType.includes("svg")) return ".svg";
  return ".jpg";
}

function createLocalFileName(url, contentType) {
  const parsed = new URL(url);
  const rawBase = path.basename(parsed.pathname);
  const baseNoExt = rawBase.includes(".")
    ? rawBase.slice(0, rawBase.lastIndexOf("."))
    : rawBase;
  const extFromPath = path.extname(rawBase);
  const ext = extFromPath || extensionFromContentType(contentType);
  const hash = crypto.createHash("md5").update(url).digest("hex").slice(0, 8);
  return `${sanitizeFileName(baseNoExt)}-${hash}${ext}`;
}

async function downloadOne(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const contentType = response.headers.get("content-type") || "";
  const fileName = createLocalFileName(url, contentType);
  const targetPath = path.join(TARGET_DIR, fileName);
  const data = Buffer.from(await response.arrayBuffer());
  await fsp.writeFile(targetPath, data);
  return `/images/products/shopify/${fileName}`;
}

async function run() {
  await fsp.mkdir(TARGET_DIR, { recursive: true });
  const content = await fsp.readFile(PRODUCT_DATA_PATH, "utf-8");
  const urlRegex = /https:\/\/cdn\.shopify\.com\/[^\s"']+/g;
  const urls = Array.from(new Set(content.match(urlRegex) || []));
  if (urls.length === 0) {
    console.log("No Shopify URLs found in lib/product-data.ts");
    return;
  }

  console.log(`Found ${urls.length} Shopify image URLs`);

  const map = new Map();
  let done = 0;
  const concurrency = 8;

  async function worker(queue) {
    while (queue.length) {
      const url = queue.pop();
      if (!url) continue;
      try {
        const localPath = await downloadOne(url);
        map.set(url, localPath);
      } catch (error) {
        console.warn(`Failed: ${url} -> ${String(error.message || error)}`);
      } finally {
        done += 1;
        if (done % 20 === 0 || done === urls.length) {
          console.log(`Progress: ${done}/${urls.length}`);
        }
      }
    }
  }

  const queue = [...urls];
  await Promise.all(Array.from({ length: concurrency }, () => worker(queue)));

  let nextContent = content;
  for (const [remoteUrl, localPath] of map.entries()) {
    nextContent = nextContent.split(remoteUrl).join(localPath);
  }
  await fsp.writeFile(PRODUCT_DATA_PATH, nextContent, "utf-8");

  const mapPath = path.join(PROJECT_ROOT, "data", "shopify-image-map.json");
  await fsp.mkdir(path.dirname(mapPath), { recursive: true });
  await fsp.writeFile(
    mapPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalFound: urls.length,
        totalDownloaded: map.size,
        map: Object.fromEntries(map.entries()),
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`Downloaded: ${map.size}/${urls.length}`);
  console.log(`Updated: ${PRODUCT_DATA_PATH}`);
  console.log(`Map saved: ${mapPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
