import type { Category, Product } from "@/types";
import { categories as baseCategories, products as baseProducts } from "@/lib/mock-data";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";
import { readJsonFile, writeJsonFile } from "@/lib/server/storage";
import { getPrismaClient } from "@/lib/server/db";
import { BUSINESS_VAT_CODE } from "@/lib/tax";

const PRODUCT_OVERRIDES_FILE = "product-overrides.json";
const LEGACY_MISC_CATEGORY_ID = "cat-egyeb";
const ACCESSORY_CATEGORY_ID = "cat-kiegeszitok";
const DEFAULT_SALE_PROMOTION_NAME = "Tavaszi leárazás";
const DEFAULT_SALE_PROMOTION_START_AT = "2026-03-17T00:00:00+01:00";
const DEFAULT_SALE_PROMOTION_END_AT = "2026-06-01T00:00:00+02:00";

type StoredProductsMap = Record<string, Product>;
let prismaCatalogSeeded = false;

function parsePromotionDate(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getEffectiveSalePrice(product: Product): number | undefined {
  const now = Date.now();
  const activePromotionSalePrices =
    product.promotions
      ?.filter((promotion) => {
        const salePrice = Number(promotion.salePrice ?? 0);
        if (!Number.isFinite(salePrice) || salePrice <= 0) return false;
        if (product.price > 0 && salePrice >= product.price) return false;
        const startAt = parsePromotionDate(promotion.startAt);
        const endAt = parsePromotionDate(promotion.endAt);
        if (startAt !== undefined && startAt > now) return false;
        if (endAt !== undefined && endAt < now) return false;
        return true;
      })
      .map((promotion) => Number(promotion.salePrice)) ?? [];

  if (activePromotionSalePrices.length > 0) {
    return Math.min(...activePromotionSalePrices);
  }

  const directSalePrice = toOptionalNumber(product.salePrice);
  if (
    directSalePrice !== undefined &&
    directSalePrice > 0 &&
    (product.price <= 0 || directSalePrice < product.price)
  ) {
    return directSalePrice;
  }
  return undefined;
}

function withNormalizedPromotions(product: Product): Product {
  const directSalePrice = toOptionalNumber(product.salePrice);
  const hasValidDirectSalePrice =
    directSalePrice !== undefined &&
    directSalePrice > 0 &&
    (product.price <= 0 || directSalePrice < product.price);

  const normalizedPromotions = (product.promotions ?? [])
    .map((promotion) => {
      const salePrice = toOptionalNumber(promotion.salePrice);
      if (salePrice === undefined || salePrice <= 0) return null;
      if (product.price > 0 && salePrice >= product.price) return null;
      const hasName = Boolean(promotion.name?.trim());
      const hasStartAt = Boolean(promotion.startAt?.trim());
      const hasEndAt = Boolean(promotion.endAt?.trim());
      if (hasName && hasStartAt && hasEndAt) return promotion;
      return {
        ...promotion,
        name: promotion.name?.trim() || DEFAULT_SALE_PROMOTION_NAME,
        startAt: promotion.startAt?.trim() || DEFAULT_SALE_PROMOTION_START_AT,
        endAt: promotion.endAt?.trim() || DEFAULT_SALE_PROMOTION_END_AT,
      };
    })
    .filter((promotion): promotion is NonNullable<typeof promotion> => Boolean(promotion));

  if (normalizedPromotions.length > 0) {
    return { ...product, promotions: normalizedPromotions };
  }

  if (!hasValidDirectSalePrice) {
    return { ...product, promotions: undefined };
  }

  return {
    ...product,
    promotions: [
      {
        name: DEFAULT_SALE_PROMOTION_NAME,
        startAt: DEFAULT_SALE_PROMOTION_START_AT,
        endAt: DEFAULT_SALE_PROMOTION_END_AT,
        salePrice: directSalePrice,
      },
    ],
  };
}

function withEffectivePricing(product: Product): Product {
  const productWithPromotions = withNormalizedPromotions(product);
  const remappedCategoryId =
    productWithPromotions.categoryId === LEGACY_MISC_CATEGORY_ID
      ? ACCESSORY_CATEGORY_ID
      : productWithPromotions.categoryId;
  const remappedCategoryIds = Array.from(
    new Set(
      (productWithPromotions.categoryIds ?? [productWithPromotions.categoryId]).map((categoryId) =>
        categoryId === LEGACY_MISC_CATEGORY_ID ? ACCESSORY_CATEGORY_ID : categoryId
      )
    )
  );
  return {
    ...productWithPromotions,
    categoryId: remappedCategoryId,
    categoryIds: remappedCategoryIds,
    vatRate: BUSINESS_VAT_CODE,
    salePrice: getEffectiveSalePrice(productWithPromotions),
  };
}

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function hasOwn(input: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function normalizeTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean);
}

function normalizeDocuments(
  value: unknown
): Array<{ name: string; url: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as Record<string, unknown>;
      const name = String(candidate.name ?? "").trim();
      const url = String(candidate.url ?? "").trim();
      if (!name || !url) return null;
      return { name, url };
    })
    .filter((entry): entry is { name: string; url: string } => Boolean(entry));
}

function normalizePromotions(
  value: unknown
): Array<{ name: string; startAt?: string; endAt?: string; salePrice?: number }> {
  if (!Array.isArray(value)) return [];
  const normalized = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as Record<string, unknown>;
      const name = String(candidate.name ?? "").trim();
      if (!name) return null;
      const startAtRaw = String(candidate.startAt ?? "").trim();
      const endAtRaw = String(candidate.endAt ?? "").trim();
      const salePrice = toOptionalNumber(candidate.salePrice);
      return {
        name,
        startAt: startAtRaw || undefined,
        endAt: endAtRaw || undefined,
        salePrice: salePrice !== undefined ? Math.max(0, salePrice) : undefined,
      };
    })
    .filter(Boolean);

  return normalized as Array<{
    name: string;
    startAt?: string;
    endAt?: string;
    salePrice?: number;
  }>;
}

export function sanitizeProductPatch(input: Record<string, unknown>): Partial<Product> {
  const output: Partial<Product> = {};
  if (typeof input.name === "string") output.name = input.name.trim();
  if (typeof input.slug === "string") output.slug = input.slug.trim();
  if (typeof input.description === "string") {
    output.description = sanitizeRichHtml(input.description);
  }
  if (typeof input.shortDesc === "string") output.shortDesc = input.shortDesc;
  if (typeof input.manufacturerSku === "string") output.manufacturerSku = input.manufacturerSku.trim();
  if (typeof input.ean === "string") output.ean = input.ean.trim();
  if (typeof input.unitName === "string") output.unitName = input.unitName.trim();
  if (typeof input.sku === "string") output.sku = input.sku.trim();
  if (typeof input.categoryId === "string") {
    const categoryId = input.categoryId.trim();
    output.categoryId = categoryId === LEGACY_MISC_CATEGORY_ID ? ACCESSORY_CATEGORY_ID : categoryId;
  }
  if (typeof input.manufacturer === "string") output.manufacturer = input.manufacturer.trim();
  if (Array.isArray(input.images)) output.images = normalizeTextArray(input.images);
  if (Array.isArray(input.documents)) output.documents = normalizeDocuments(input.documents);
  if (Array.isArray(input.categoryIds)) {
    output.categoryIds = normalizeTextArray(input.categoryIds).map((categoryId) =>
      categoryId === LEGACY_MISC_CATEGORY_ID ? ACCESSORY_CATEGORY_ID : categoryId
    );
  }
  if (Array.isArray(input.tags)) output.tags = normalizeTextArray(input.tags);
  if (Array.isArray(input.ageGroups)) output.ageGroups = normalizeTextArray(input.ageGroups);
  if (Array.isArray(input.excludedPaymentMethods)) {
    output.excludedPaymentMethods = normalizeTextArray(input.excludedPaymentMethods);
  }
  if (Array.isArray(input.excludedShippingMethods)) {
    output.excludedShippingMethods = normalizeTextArray(input.excludedShippingMethods);
  }
  if (Array.isArray(input.promotions)) output.promotions = normalizePromotions(input.promotions);
  if (typeof input.attributes === "object" && input.attributes !== null) {
    output.attributes = input.attributes as Product["attributes"];
  }
  if (typeof input.supplierUrl === "string") output.supplierUrl = input.supplierUrl.trim();
  if (hasOwn(input, "vatRate")) output.vatRate = BUSINESS_VAT_CODE;
  if (typeof input.weightUnit === "string") output.weightUnit = input.weightUnit.trim();
  if (typeof input.sizeValue === "string") output.sizeValue = input.sizeValue.trim();
  if (typeof input.sizeUnit === "string") output.sizeUnit = input.sizeUnit.trim();
  if (typeof input.metaTitle === "string") output.metaTitle = input.metaTitle;
  if (typeof input.metaDescription === "string") output.metaDescription = input.metaDescription;
  if (typeof input.isActive === "boolean") output.isActive = input.isActive;
  if (typeof input.isFeatured === "boolean") output.isFeatured = input.isFeatured;

  const price = toOptionalNumber(input.price);
  if (price !== undefined) output.price = Math.max(0, price);

  if (hasOwn(input, "salePrice")) {
    const salePrice = toOptionalNumber(input.salePrice);
    output.salePrice = salePrice !== undefined ? Math.max(0, salePrice) : undefined;
  }

  const stock = toOptionalNumber(input.stock);
  if (stock !== undefined) output.stock = Math.max(0, Math.floor(stock));

  if (hasOwn(input, "weight")) {
    const weight = toOptionalNumber(input.weight);
    output.weight = weight !== undefined ? Math.max(0, weight) : undefined;
  }

  if (hasOwn(input, "purchasePrice")) {
    const purchasePrice = toOptionalNumber(input.purchasePrice);
    output.purchasePrice = purchasePrice !== undefined ? Math.max(0, purchasePrice) : undefined;
  }

  if (hasOwn(input, "rating")) {
    const rating = toOptionalNumber(input.rating);
    output.rating = rating !== undefined ? Math.min(5, Math.max(0, rating)) : undefined;
  }

  if (hasOwn(input, "reviewCount")) {
    const reviewCount = toOptionalNumber(input.reviewCount);
    output.reviewCount = reviewCount !== undefined ? Math.max(0, Math.floor(reviewCount)) : undefined;
  }

  return output;
}

export async function getStoredProductOverrides(): Promise<StoredProductsMap> {
  return readJsonFile<StoredProductsMap>(PRODUCT_OVERRIDES_FILE, {});
}

export async function saveStoredProductOverrides(value: StoredProductsMap): Promise<void> {
  await writeJsonFile(PRODUCT_OVERRIDES_FILE, value);
}

export async function getEffectiveProducts(): Promise<Product[]> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      if (!prismaCatalogSeeded) {
        await ensureCatalogSeeded();
        prismaCatalogSeeded = true;
      }
      const dbProducts = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
      });
      return dbProducts.map((entry) => withEffectivePricing(mapDbProduct(entry)));
    } catch (error) {
      console.error("Prisma getEffectiveProducts fallback to in-memory:", error);
    }
  }

  const overrides = await getStoredProductOverrides();
  const map = new Map<string, Product>();

  for (const product of baseProducts) {
    map.set(product.id, product);
  }

  for (const [id, product] of Object.entries(overrides)) {
    map.set(id, product);
  }

  return Array.from(map.values()).map((entry) => withEffectivePricing(entry));
}

export async function getEffectiveProductById(id: string): Promise<Product | undefined> {
  const all = await getEffectiveProducts();
  return all.find((entry) => entry.id === id);
}

export async function getEffectiveProductBySlug(slug: string): Promise<Product | undefined> {
  const all = await getEffectiveProducts();
  return all.find((entry) => entry.slug === slug);
}

export async function updateProductById(
  id: string,
  patch: Record<string, unknown>
): Promise<Product | null> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const current = await prisma.product.findUnique({ where: { id } });
      if (!current) return null;
      const sanitized = sanitizeProductPatch(patch);
      const updated = await prisma.product.update({
        where: { id },
        data: {
          name: sanitized.name,
          slug: sanitized.slug,
          description: sanitized.description,
          shortDesc: sanitized.shortDesc,
          manufacturerSku: sanitized.manufacturerSku,
          ean: sanitized.ean,
          unitName: sanitized.unitName,
          price: sanitized.price,
          salePrice: sanitized.salePrice,
          purchasePrice: sanitized.purchasePrice,
          vatRate: sanitized.vatRate,
          sku: sanitized.sku,
          stock: sanitized.stock,
          images: sanitized.images as any,
          documents: sanitized.documents as any,
          categoryId: sanitized.categoryId,
          categoryIds: sanitized.categoryIds,
          manufacturer: sanitized.manufacturer,
          tags: sanitized.tags,
          weight: sanitized.weight,
          weightUnit: sanitized.weightUnit,
          sizeValue: sanitized.sizeValue,
          sizeUnit: sanitized.sizeUnit,
          attributes: sanitized.attributes as any,
          supplierUrl: sanitized.supplierUrl,
          excludedPaymentMethods: sanitized.excludedPaymentMethods,
          excludedShippingMethods: sanitized.excludedShippingMethods,
          promotions: sanitized.promotions as any,
          rating: sanitized.rating,
          reviewCount: sanitized.reviewCount,
          ageGroups: sanitized.ageGroups,
          metaTitle: sanitized.metaTitle,
          metaDescription: sanitized.metaDescription,
          isActive: sanitized.isActive,
          isFeatured: sanitized.isFeatured,
        },
      });
      return withEffectivePricing(mapDbProduct(updated));
    } catch (error) {
      console.error("Prisma updateProductById fallback to file:", error);
    }
  }

  const current = await getEffectiveProductById(id);
  if (!current) return null;

  const sanitized = sanitizeProductPatch(patch);
  const next: Product = {
    ...current,
    ...sanitized,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };

  const overrides = await getStoredProductOverrides();
  overrides[id] = next;
  await saveStoredProductOverrides(overrides);
  return withEffectivePricing(next);
}

export function getEffectiveCategories(): Category[] {
  const prisma = getPrismaClient();
  if (!prisma) return baseCategories;
  // Caller-side behavior remains sync-compatible; when DB is enabled categories are seeded from base list.
  return baseCategories;
}

async function ensureCatalogSeeded(): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) return;
  const [categoryCount, productCount] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
  ]);
  if (categoryCount > 0 && productCount > 0) return;

  const overrides = await getStoredProductOverrides();
  const merged = new Map<string, Product>();
  for (const entry of baseProducts) merged.set(entry.id, entry);
  for (const [id, entry] of Object.entries(overrides)) merged.set(id, entry);

  if (categoryCount === 0) {
    await prisma.category.createMany({
      data: baseCategories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        image: category.image,
        parentId: category.parentId,
        sortOrder: category.sortOrder ?? 0,
      })),
      skipDuplicates: true,
    });
  }

  if (productCount === 0) {
    await prisma.product.createMany({
      data: Array.from(merged.values()).map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        shortDesc: product.shortDesc,
        manufacturerSku: product.manufacturerSku,
        ean: product.ean,
        unitName: product.unitName,
        price: product.price,
        salePrice: product.salePrice,
        purchasePrice: product.purchasePrice,
        vatRate: product.vatRate,
        sku: product.sku,
        stock: product.stock,
        images: product.images as any,
        documents: (product.documents as any) ?? undefined,
        categoryId: product.categoryId,
        categoryIds: product.categoryIds ?? [product.categoryId],
        manufacturer: product.manufacturer,
        tags: product.tags,
        weight: product.weight,
        weightUnit: product.weightUnit,
        sizeValue: product.sizeValue,
        sizeUnit: product.sizeUnit,
        attributes: (product.attributes as any) ?? undefined,
        supplierUrl: product.supplierUrl,
        excludedPaymentMethods: product.excludedPaymentMethods ?? [],
        excludedShippingMethods: product.excludedShippingMethods ?? [],
        promotions: (product.promotions as any) ?? undefined,
        rating: product.rating,
        reviewCount: product.reviewCount,
        ageGroups: product.ageGroups ?? [],
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt),
      })),
      skipDuplicates: true,
    });
  }
}

function mapDbProduct(product: any): Product {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    shortDesc: product.shortDesc ?? undefined,
    manufacturerSku: product.manufacturerSku ?? undefined,
    ean: product.ean ?? undefined,
    unitName: product.unitName ?? undefined,
    price: toNumber(product.price),
    salePrice: product.salePrice !== null ? toNumber(product.salePrice) : undefined,
    purchasePrice: product.purchasePrice !== null ? toNumber(product.purchasePrice) : undefined,
    vatRate: product.vatRate ?? undefined,
    sku: product.sku,
    stock: product.stock,
    images: (product.images as string[]) ?? [],
    documents: (product.documents as Product["documents"]) ?? undefined,
    categoryId: product.categoryId,
    categoryIds: product.categoryIds ?? [product.categoryId],
    manufacturer: product.manufacturer ?? undefined,
    tags: product.tags ?? [],
    weight: product.weight ?? undefined,
    weightUnit: product.weightUnit ?? undefined,
    sizeValue: product.sizeValue ?? undefined,
    sizeUnit: product.sizeUnit ?? undefined,
    attributes: (product.attributes as Product["attributes"]) ?? undefined,
    supplierUrl: product.supplierUrl ?? undefined,
    excludedPaymentMethods: product.excludedPaymentMethods ?? [],
    excludedShippingMethods: product.excludedShippingMethods ?? [],
    promotions: (product.promotions as Product["promotions"]) ?? undefined,
    rating: product.rating ?? undefined,
    reviewCount: product.reviewCount ?? undefined,
    ageGroups: product.ageGroups ?? [],
    metaTitle: product.metaTitle ?? undefined,
    metaDescription: product.metaDescription ?? undefined,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    createdAt: new Date(product.createdAt).toISOString(),
    updatedAt: new Date(product.updatedAt).toISOString(),
  };
}
