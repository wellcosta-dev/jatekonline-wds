import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getEffectiveCategories, getEffectiveProducts } from "@/lib/server/products";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const [products, categories] = await Promise.all([
      getEffectiveProducts(),
      Promise.resolve(getEffectiveCategories()),
    ]);

    return NextResponse.json({ products, categories });
  } catch (error) {
    console.error("GET /api/admin/products error:", error);
    return NextResponse.json(
      { error: "Nem sikerült betölteni a termék adatokat." },
      { status: 500 }
    );
  }
}
