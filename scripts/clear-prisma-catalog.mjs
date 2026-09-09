/**
 * Törli a Product és Category sorokat a PostgreSQL adatbázisból (és a kapcsolódó Review + Order sorokat),
 * hogy a következő kérésnél az ensureCatalogSeeded újra feltöltse a katalógust a lib/product-data.ts alapján.
 *
 * Futtatás: npm run db:clear-catalog
 * Indítsd újra a dev szervert utána (prismaCatalogSeeded cache).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLocal = path.join(__dirname, "..", ".env.local");
if (!process.env.DATABASE_URL && fs.existsSync(envLocal)) {
  const raw = fs.readFileSync(envLocal, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key === "DATABASE_URL") process.env.DATABASE_URL = val;
  }
}

if (!process.env.DATABASE_URL) {
  console.warn("Nincs DATABASE_URL — kihagyva (file-alapú katalógus: lib/product-data.ts + üres overrides).");
  process.exit(0);
}

const prisma = new PrismaClient();

async function main() {
  const deletedReviews = await prisma.review.deleteMany({});
  const deletedOrders = await prisma.order.deleteMany({});
  const deletedProducts = await prisma.product.deleteMany({});
  const deletedCategories = await prisma.category.deleteMany({});
  console.log("Deleted:", {
    reviews: deletedReviews.count,
    orders: deletedOrders.count,
    products: deletedProducts.count,
    categories: deletedCategories.count,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
