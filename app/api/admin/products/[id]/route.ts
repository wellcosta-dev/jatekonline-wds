import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getEffectiveProductById, updateProductById } from "@/lib/server/products";

type RouteParams = { params: Promise<{ id: string }> };

function getProductQualityIssues(product: {
  name?: string;
  shortDesc?: string;
  description?: string;
  manufacturer?: string;
  ean?: string;
  manufacturerSku?: string;
  images?: string[];
  price?: number;
  salePrice?: number;
}): string[] {
  const issues: string[] = [];
  if (!product.name?.trim()) issues.push("missing_name");
  if (!product.shortDesc?.trim() && !product.description?.trim()) issues.push("weak_description");
  if (!product.manufacturer?.trim()) issues.push("missing_brand");
  if (!product.ean?.trim()) issues.push("missing_gtin");
  if (!product.manufacturerSku?.trim()) issues.push("missing_mpn");
  if (!product.images?.[0]) issues.push("missing_primary_image");
  if (!Number.isFinite(Number(product.price ?? 0)) || Number(product.price ?? 0) <= 0) {
    issues.push("invalid_price");
  }
  if (product.salePrice !== undefined) {
    const salePrice = Number(product.salePrice);
    const basePrice = Number(product.price ?? 0);
    if (!Number.isFinite(salePrice) || salePrice <= 0 || (basePrice > 0 && salePrice >= basePrice)) {
      issues.push("invalid_sale_price");
    }
  }
  return issues;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const { id } = await params;
    const product = await getEffectiveProductById(id);
    if (!product) {
      return NextResponse.json({ error: "A termék nem található." }, { status: 404 });
    }

    return NextResponse.json({ product, qualityIssues: getProductQualityIssues(product) });
  } catch (error) {
    console.error("GET /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { error: "Nem sikerült betölteni a terméket." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    if ("salePrice" in body && body.salePrice !== undefined && body.salePrice !== null) {
      const salePrice = Number(body.salePrice);
      const basePrice = Number(body.price ?? 0);
      if (!Number.isFinite(salePrice) || salePrice <= 0 || (basePrice > 0 && salePrice >= basePrice)) {
        return NextResponse.json(
          { error: "Az akciós árnak pozitívnak és az alapárnál kisebbnek kell lennie." },
          { status: 400 }
        );
      }
    }
    const updated = await updateProductById(id, body);

    if (!updated) {
      return NextResponse.json({ error: "A termék nem található." }, { status: 404 });
    }

    return NextResponse.json({ product: updated, qualityIssues: getProductQualityIssues(updated) });
  } catch (error) {
    console.error("PUT /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { error: "Nem sikerült menteni a terméket." },
      { status: 500 }
    );
  }
}
