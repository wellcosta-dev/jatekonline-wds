import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/api-auth";
import { getApprovedReviewsByProduct, submitPendingReview } from "@/lib/server/reviews";

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get("productId")?.trim();
    if (!productId) {
      return NextResponse.json({ error: "A productId kötelező." }, { status: 400 });
    }
    const reviews = await getApprovedReviewsByProduct(productId);
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json({ error: "Nem sikerült a vélemények betöltése." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Véleményíráshoz bejelentkezés szükséges." }, { status: 401 });
    }

    const body = await request.json();
    const review = await submitPendingReview({
      productId: String(body.productId ?? ""),
      userId: session.id,
      userEmail: session.email,
      authorName: String(body.authorName ?? session.name ?? ""),
      rating: Number(body.rating ?? 5),
      content: String(body.content ?? ""),
    });

    return NextResponse.json({ review, message: "Köszönjük az értékelésed. Egy adminisztrátor hamarosan jóváhagyja." }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nem sikerült elküldeni a véleményt.";
    const status = message.includes("24 órán belül") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
