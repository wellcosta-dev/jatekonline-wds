import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getAdminReviews } from "@/lib/server/reviews";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const status = request.nextUrl.searchParams.get("status")?.toUpperCase();
    const reviews = await getAdminReviews();
    const filtered =
      status === "PENDING" || status === "APPROVED"
        ? reviews.filter((item) => item.status === status)
        : reviews;

    return NextResponse.json({ reviews: filtered });
  } catch (error) {
    console.error("GET /api/admin/reviews error:", error);
    return NextResponse.json({ error: "Nem sikerült betölteni a véleményeket." }, { status: 500 });
  }
}
