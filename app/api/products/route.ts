import { NextRequest, NextResponse } from "next/server";
import type { Product } from "@/types";
import { getEffectiveCategories, getEffectiveProducts } from "@/lib/server/products";
import { maybeTriggerAutomaticSupplierSync } from "@/lib/server/supplier-sync";

export async function GET(request: NextRequest) {
  try {
    await maybeTriggerAutomaticSupplierSync();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const [allProducts, categories] = await Promise.all([
      getEffectiveProducts(),
      Promise.resolve(getEffectiveCategories()),
    ]);
    const categoryId = category
      ? categories.find((entry) => entry.slug === category || entry.id === category)?.id
      : undefined;
    let result: Product[] = categoryId
      ? allProducts.filter((product) => product.categoryId === categoryId)
      : [...allProducts];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some((t) => t.toLowerCase().includes(searchLower))
      );
    }

    switch (sort) {
      case "price-asc":
        result.sort(
          (a, b) =>
            (a.salePrice ?? a.price) - (b.salePrice ?? b.price)
        );
        break;
      case "price-desc":
        result.sort(
          (a, b) =>
            (b.salePrice ?? b.price) - (a.salePrice ?? a.price)
        );
        break;
      case "rating":
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      default:
        break;
    }

    const total = result.length;
    const paginated = result.slice(offset, offset + limit);

    return NextResponse.json({
      products: paginated,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = {
      ...body,
      id: body.id ?? `cl${Date.now()}`,
      slug: body.slug ?? body.name?.toLowerCase().replace(/\s+/g, "-") ?? "new-product",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
