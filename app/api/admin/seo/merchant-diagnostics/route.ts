import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getEffectiveProducts } from "@/lib/server/products";

function extractDigits(value: string): string {
  return value.replace(/\D+/g, "");
}

function looksLikeValidGtin(value: string): boolean {
  return [8, 12, 13, 14].includes(value.length);
}

function normalizeScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const products = (await getEffectiveProducts()).filter((p) => p.isActive);

    const diagnostics = products.map((product) => {
      const issues: string[] = [];
      const basePrice = Number(product.price ?? 0);
      const salePrice = product.salePrice !== undefined ? Number(product.salePrice) : undefined;
      const primaryImage = product.images?.[0] ?? "";
      const gtinCandidate = extractDigits(product.ean || product.sku || "");
      const brand = product.manufacturer?.trim() ?? "";
      const mpn = product.manufacturerSku?.trim() || product.sku?.trim() || "";
      const hasValidDescription = String(product.shortDesc || product.description || "").trim().length >= 60;

      if (!product.name?.trim()) issues.push("missing_name");
      if (!product.slug?.trim()) issues.push("missing_slug");
      if (!primaryImage) issues.push("missing_primary_image");
      if (primaryImage.includes("/images/placeholder")) issues.push("placeholder_primary_image");
      if (!product.sku?.trim()) issues.push("missing_sku");
      if (!Number.isFinite(basePrice) || basePrice <= 0) issues.push("invalid_price");
      if (salePrice !== undefined && (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= basePrice)) {
        issues.push("invalid_sale_price");
      }
      if (!brand) issues.push("missing_brand");
      if (!mpn) issues.push("missing_mpn");
      if (!looksLikeValidGtin(gtinCandidate)) issues.push("gtin_not_detected");
      if (!product.categoryId?.trim()) issues.push("missing_category");
      if (!hasValidDescription) issues.push("weak_description");

      const weightedPenalty = issues.reduce((sum, issue) => {
        if (issue === "invalid_price" || issue === "missing_name") return sum + 20;
        if (issue === "missing_primary_image" || issue === "missing_brand" || issue === "gtin_not_detected") return sum + 12;
        if (issue === "placeholder_primary_image") return sum + 16;
        if (issue === "invalid_sale_price" || issue === "missing_mpn" || issue === "missing_category") return sum + 8;
        return sum + 5;
      }, 0);
      const qualityScore = normalizeScore(100 - weightedPenalty);

      return {
        id: product.id,
        sku: product.sku,
        slug: product.slug,
        issues,
        qualityScore,
      };
    });

    const withIssues = diagnostics.filter((item) => item.issues.length > 0);
    return NextResponse.json({
      totalActiveProducts: products.length,
      productsWithIssues: withIssues.length,
      issueCounts: {
        missing_name: withIssues.filter((p) => p.issues.includes("missing_name")).length,
        missing_slug: withIssues.filter((p) => p.issues.includes("missing_slug")).length,
        missing_primary_image: withIssues.filter((p) => p.issues.includes("missing_primary_image")).length,
        placeholder_primary_image: withIssues.filter((p) =>
          p.issues.includes("placeholder_primary_image")
        ).length,
        missing_sku: withIssues.filter((p) => p.issues.includes("missing_sku")).length,
        invalid_price: withIssues.filter((p) => p.issues.includes("invalid_price")).length,
        invalid_sale_price: withIssues.filter((p) => p.issues.includes("invalid_sale_price")).length,
        missing_brand: withIssues.filter((p) => p.issues.includes("missing_brand")).length,
        missing_mpn: withIssues.filter((p) => p.issues.includes("missing_mpn")).length,
        gtin_not_detected: withIssues.filter((p) => p.issues.includes("gtin_not_detected")).length,
        missing_category: withIssues.filter((p) => p.issues.includes("missing_category")).length,
        weak_description: withIssues.filter((p) => p.issues.includes("weak_description")).length,
      },
      averageQualityScore:
        diagnostics.length > 0
          ? normalizeScore(
              diagnostics.reduce((sum, item) => sum + item.qualityScore, 0) / diagnostics.length
            )
          : 0,
      highRiskForMerchantBan: {
        noNameOrInvalidPrice: withIssues.filter(
          (p) => p.issues.includes("missing_name") || p.issues.includes("invalid_price")
        ).length,
        placeholderImage: withIssues.filter((p) => p.issues.includes("placeholder_primary_image")).length,
        noBrandAndNoGlobalId: withIssues.filter(
          (p) =>
            p.issues.includes("missing_brand") &&
            p.issues.includes("missing_mpn") &&
            p.issues.includes("gtin_not_detected")
        ).length,
      },
      samples: withIssues.slice(0, 100),
    });
  } catch (error) {
    console.error("GET /api/admin/seo/merchant-diagnostics error:", error);
    return NextResponse.json(
      { error: "Nem sikerult a Merchant feed diagnozis lekérése." },
      { status: 500 }
    );
  }
}
