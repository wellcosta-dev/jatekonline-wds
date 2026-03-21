import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getAbandonedCartsWithAutomation } from "@/lib/server/abandoned-carts";

export async function GET(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const carts = await getAbandonedCartsWithAutomation();
    return NextResponse.json({ carts });
  } catch (error) {
    console.error("GET /api/admin/abandoned-carts error:", error);
    return NextResponse.json({ error: "Nem sikerült betölteni az elhagyott kosarakat." }, { status: 500 });
  }
}
