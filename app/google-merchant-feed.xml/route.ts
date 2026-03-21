import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/seo";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/utils";
import { getEffectiveCategories, getEffectiveProducts } from "@/lib/server/products";
import { MERCHANT_STANDARD_SHIPPING_PRICE_HUF } from "@/lib/merchant-policy";
import { BUSINESS_VAT_RATE_PERCENT, toNetPrice } from "@/lib/tax";

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

function toPriceHuf(value: number): string {
  return `${Math.max(0, Number(value || 0)).toFixed(2)} HUF`;
}

function toCents(value: number): number {
  return Math.round(Math.max(0, Number(value || 0)) * 100);
}

function extractDigits(value: string): string {
  return value.replace(/\D+/g, "");
}

function looksLikeValidGtin(value: string): boolean {
  return [8, 12, 13, 14].includes(value.length);
}

function toRfc3339(value?: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().replace(".000Z", "Z");
}

function getGoogleProductCategory(categorySlug: string): string | undefined {
  switch (categorySlug) {
    case "pelenkak":
      return "Baby & Toddler > Diapering > Diapers";
    case "etetes":
      return "Baby & Toddler > Nursing & Feeding";
    case "biztonsag":
      return "Baby & Toddler > Baby Transport > Car Seats";
    case "babakocsi":
      return "Baby & Toddler > Baby Transport > Strollers";
    case "furdetes":
      return "Baby & Toddler > Bathing";
    case "babaszoba":
      return "Baby & Toddler > Nursery";
    default:
      return undefined;
  }
}

export async function GET() {
  const [products, categories] = await Promise.all([
    getEffectiveProducts(),
    Promise.resolve(getEffectiveCategories()),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const activeProducts = products.filter((p) => p.isActive);

  const itemsXml = activeProducts
    .filter((product) => {
      const hasName = Boolean(product.name?.trim());
      const hasSlug = Boolean(product.slug?.trim());
      const hasValidPrice = Number(product.price ?? 0) > 0;
      const firstImage = product.images?.[0] || "";
      const hasRealPrimaryImage = firstImage.length > 0 && !firstImage.includes("/images/placeholder");
      return hasName && hasSlug && hasValidPrice && hasRealPrimaryImage;
    })
    .map((product) => {
      const link = absoluteUrl(`/termekek/${product.slug}`);
      const title = escapeXml(product.name);
      const description = escapeXml(
        stripHtml(product.shortDesc || product.description || product.name).slice(0, 5000)
      );
      const basePrice = Math.max(0, Number(product.price ?? 0));
      const basePriceCents = toCents(basePrice);
      const salePriceCents = toCents(Number(product.salePrice ?? 0));
      const hasSalePrice =
        typeof product.salePrice === "number" && salePriceCents > 0 && salePriceCents < basePriceCents;
      const baseNetPrice = toNetPrice(basePrice, product.vatRate);
      const saleNetPrice = hasSalePrice ? toNetPrice(Number(product.salePrice), product.vatRate) : undefined;
      const effectivePrice = hasSalePrice ? Number(product.salePrice) : basePrice;
      const imageLink = absoluteUrl(product.images?.[0] || "/images/placeholder.jpg");
      const additionalImages = (product.images || [])
        .slice(1, 10)
        .map((image) => `      <g:additional_image_link>${escapeXml(absoluteUrl(image))}</g:additional_image_link>`)
        .join("\n");
      const category = categoryById.get(product.categoryId);
      const productType = escapeXml(category?.name || "Babatermék");
      const googleProductCategoryRaw = getGoogleProductCategory(category?.slug || "");
      const googleProductCategory = googleProductCategoryRaw
        ? escapeXml(googleProductCategoryRaw)
        : undefined;
      const availability = product.stock > 0 ? "in_stock" : "out_of_stock";
      const shippingPrice =
        effectivePrice >= FREE_SHIPPING_THRESHOLD ? 0 : MERCHANT_STANDARD_SHIPPING_PRICE_HUF;
      const eanDigits = extractDigits(product.ean || "");
      const skuDigits = extractDigits(product.sku || "");
      const gtin = looksLikeValidGtin(eanDigits) ? eanDigits : looksLikeValidGtin(skuDigits) ? skuDigits : "";
      const brand = escapeXml(product.manufacturer?.trim() || "FreeOn");
      const mpnRaw = product.manufacturerSku?.trim() || product.sku?.trim() || "";
      const escapedMpn = escapeXml(mpnRaw);
      const identifierExists = gtin || escapedMpn ? "yes" : "no";
      const activePromotion = (product.promotions || []).find(
        (entry) =>
          typeof entry.salePrice === "number" &&
          entry.salePrice > 0 &&
          entry.salePrice < basePrice &&
          (!entry.startAt || new Date(entry.startAt).getTime() <= Date.now()) &&
          (!entry.endAt || new Date(entry.endAt).getTime() >= Date.now())
      );
      const saleStart = toRfc3339(activePromotion?.startAt);
      const saleEnd = toRfc3339(activePromotion?.endAt);
      const saleWindow = hasSalePrice && saleStart && saleEnd ? `${saleStart}/${saleEnd}` : undefined;

      return `    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
${additionalImages ? `${additionalImages}\n` : ""}      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:price>${toPriceHuf(basePrice)}</g:price>
      <g:tax>
        <g:country>HU</g:country>
        <g:rate>${BUSINESS_VAT_RATE_PERCENT}</g:rate>
      </g:tax>
      <bo:net_price>${toPriceHuf(baseNetPrice)}</bo:net_price>
${hasSalePrice ? `      <g:sale_price>${toPriceHuf(Number(product.salePrice))}</g:sale_price>\n` : ""}${saleNetPrice !== undefined ? `      <bo:sale_net_price>${toPriceHuf(saleNetPrice)}</bo:sale_net_price>\n` : ""}${saleWindow ? `      <g:sale_price_effective_date>${saleWindow}</g:sale_price_effective_date>\n` : ""}      <g:brand>${brand}</g:brand>
${gtin ? `      <g:gtin>${gtin}</g:gtin>\n` : ""}${escapedMpn ? `      <g:mpn>${escapedMpn}</g:mpn>\n` : ""}      <g:identifier_exists>${identifierExists}</g:identifier_exists>
${googleProductCategory ? `      <g:google_product_category>${googleProductCategory}</g:google_product_category>\n` : ""}      <g:product_type>${productType}</g:product_type>
      <g:adult>no</g:adult>
      <g:shipping>
        <g:country>HU</g:country>
        <g:service>Standard</g:service>
        <g:price>${toPriceHuf(shippingPrice)}</g:price>
      </g:shipping>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0" xmlns:bo="https://babyonline.hu/ns/feed">
  <channel>
    <title>BabyOnline.hu Product Feed</title>
    <link>${escapeXml(absoluteUrl("/"))}</link>
    <description>Google Merchant Center termek feed</description>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=3600",
    },
  });
}
