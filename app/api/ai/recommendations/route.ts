import { NextRequest, NextResponse } from "next/server";
import { products } from "@/lib/mock-data";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productId = body.productId;

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const product = products.find((p) => p.id === productId);

    let candidates = products.filter((p) => p.id !== productId);

    if (product) {
      const sameCategory = candidates.filter(
        (p) => p.categoryId === product.categoryId
      );
      const others = candidates.filter(
        (p) => p.categoryId !== product.categoryId
      );
      candidates = [...sameCategory, ...shuffle(others)];
    } else {
      candidates = shuffle(candidates);
    }

    const recommendedIds = candidates.slice(0, 5).map((p) => p.id);

    return NextResponse.json({ productIds: recommendedIds });
  } catch (error) {
    console.error("POST /api/ai/recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
