import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getUnseenOrdersCount, markOrdersSeenNow } from "@/lib/server/admin-order-unseen";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const count = await getUnseenOrdersCount();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("GET /api/admin/orders/unseen error:", error);
    return NextResponse.json(
      { error: "Nem sikerült lekérni az új rendelések számát." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    await markOrdersSeenNow();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/orders/unseen error:", error);
    return NextResponse.json(
      { error: "Nem sikerült frissíteni a rendelés-jelzőt." },
      { status: 500 }
    );
  }
}

