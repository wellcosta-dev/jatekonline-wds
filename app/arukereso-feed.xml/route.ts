import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/seo";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/utils";
import { MERCHANT_STANDARD_SHIPPING_PRICE_HUF } from "@/lib/merchant-policy";
import { getEffectiveCategories, getEffectiveProducts } from "@/lib/server/products";
import { toNetPrice, roundHuf } from "@/lib/tax";
import type { Category, Product } from "@/types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function digitsOnly(value: string): string {
  return value.replace(/\D+/g, "");
}

function isValidEan(value: string): boolean {
  return value.length >= 8 && value.length <= 13;
}

function getCategoryPath(category: Category | undefined, byId: Map<string, Category>): string {
  if (!category) return "Bababolt > Egyéb";
  const parts: string[] = [];
  const seen = new Set<string>();
  let current: Category | undefined = category;
  while (current && !seen.has(current.id)) {
    parts.unshift(current.name);
    seen.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return parts.join(" > ") || "Bababolt > Egyéb";
}

function getDeliveryTimeText(product: Product): string {
  if (product.stock > 0) return "1 munkanap";
  return "5 munkanap";
}

function getDeliveryCostText(price: number): string {
  if (price >= FREE_SHIPPING_THRESHOLD) return "FREE";
  return `${roundHuf(MERCHANT_STANDARD_SHIPPING_PRICE_HUF)} Ft`;
}

function toAttributesXml(attributes?: Record<string, string | string[]>): string {
  if (!attributes) return "";
  const rows = Object.entries(attributes)
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((entry) => ({ key, value: String(entry) }));
      }
      return [{ key, value: String(value) }];
    })
    .map((entry) => ({
      key: entry.key.trim(),
      value: entry.value.trim(),
    }))
    .filter((entry) => entry.key && entry.value);

  if (rows.length === 0) return "";

  const itemsXml = rows
    .map(
      (entry) => `      <Attribute>
        <Attribute_name>${escapeXml(entry.key)}</Attribute_name>
        <Attribute_value>${escapeXml(entry.value)}</Attribute_value>
      </Attribute>`
    )
    .join("\n");

  return `    <Attributes>
${itemsXml}
    </Attributes>`;
}

export async function GET() {
  const [products, categories] = await Promise.all([
    getEffectiveProducts(),
    Promise.resolve(getEffectiveCategories()),
  ]);

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const activeProducts = products.filter((product) => product.isActive);

  const itemsXml = activeProducts
    .filter((product) => {
      return Boolean(product.id && product.name?.trim() && product.slug?.trim());
    })
    .map((product) => {
      const effectivePrice =
        typeof product.salePrice === "number" && product.salePrice > 0 && product.salePrice < product.price
          ? Number(product.salePrice)
          : Number(product.price || 0);
      const grossPrice = roundHuf(effectivePrice);
      const netPrice = toNetPrice(grossPrice, product.vatRate);
      const category = categoryById.get(product.categoryId);
      const categoryPath = getCategoryPath(category, categoryById);
      const productUrl = absoluteUrl(`/termekek/${product.slug}`);
      const manufacturer = (product.manufacturer || "FreeOn").trim() || "FreeOn";
      const imageUrl = product.images?.[0] ? absoluteUrl(product.images[0]) : "";
      const secondImageUrl = product.images?.[1] ? absoluteUrl(product.images[1]) : "";
      const description = stripHtml(product.shortDesc || product.description || product.name).slice(0, 5000);
      const eanDigits = digitsOnly(product.ean || "");
      const hasValidEan = isValidEan(eanDigits);
      const productNumber = (product.manufacturerSku || product.sku || "").trim();
      const attributesXml = toAttributesXml(product.attributes);
      const deliveryTime = getDeliveryTimeText(product);
      const deliveryCost = getDeliveryCostText(grossPrice);

      return `  <Product>
    <Identifier>${escapeXml(product.id)}</Identifier>
    <Manufacturer>${escapeXml(manufacturer)}</Manufacturer>
    <Name>${escapeXml(product.name)}</Name>
    <Category>${escapeXml(categoryPath)}</Category>
    <ProductUrl>${escapeXml(productUrl)}</ProductUrl>
    <Price>${grossPrice}</Price>
    <NetPrice>${netPrice}</NetPrice>
${productNumber ? `    <ProductNumber>${escapeXml(productNumber)}</ProductNumber>\n` : ""}${hasValidEan ? `    <EanCode>${eanDigits}</EanCode>\n` : ""}    <DeliveryTime>${escapeXml(deliveryTime)}</DeliveryTime>
    <DeliveryCost>${escapeXml(deliveryCost)}</DeliveryCost>
${description ? `    <Description>${escapeXml(description)}</Description>\n` : ""}${imageUrl ? `    <ImageUrl>${escapeXml(imageUrl)}</ImageUrl>\n` : ""}${secondImageUrl ? `    <ImageUrl2>${escapeXml(secondImageUrl)}</ImageUrl2>\n` : ""}${attributesXml ? `${attributesXml}\n` : ""}  </Product>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Products>
${itemsXml}
</Products>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=3600",
    },
  });
}
