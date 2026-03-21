import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/api-auth";
import { trackAbandonedCartActivity } from "@/lib/server/abandoned-carts";

export async function POST(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const body = (await request.json()) as {
      sessionId?: string;
      items?: Array<{
        productId: string;
        productName: string;
        price: number;
        quantity: number;
      }>;
      subtotal?: number;
      clear?: boolean;
    };
    await trackAbandonedCartActivity({
      sessionId: String(body.sessionId ?? ""),
      userEmail: session?.email,
      userId: session?.id,
      items: body.items ?? [],
      subtotal: Number(body.subtotal ?? 0),
      clear: Boolean(body.clear),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/abandoned-carts/track error:", error);
    return NextResponse.json({ error: "Nem sikerült a kosár esemény mentése." }, { status: 400 });
  }
}
