import type { Category, Product } from "@/types";

import regioCatalog from "../data/regio-catalog.json";

type RegioCatalogFile = {
  version?: number;
  generatedAt?: string;
  source?: string;
  excludes?: string[];
  categories: Category[];
  products: Product[];
};

const { categories, products } = regioCatalog as RegioCatalogFile;

/** Regio katalógus — forrás: `data/regio-catalog.json` (`npm run catalog:regio` minta vagy `npm run catalog:regio-full` teljes). */
export const shopifyCategories: Category[] = categories;
export const shopifyProducts: Product[] = products;
