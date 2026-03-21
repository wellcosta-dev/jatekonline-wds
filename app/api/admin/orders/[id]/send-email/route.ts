import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/server/orders";
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from "@/lib/email/sender";
import { requireAdmin } from "@/lib/server/api-auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const body = await request.json();
    const type = body.type as "confirmation" | "status_update";
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Rendelés nem található" }, { status: 404 });
    }
    if (!order.guestEmail) {
      return NextResponse.json({ error: "Nincs vásárlói email cím" }, { status: 400 });
    }

    if (type === "confirmation") {
      await sendOrderConfirmationEmail(order);
      return NextResponse.json({ ok: true });
    }
    if (type === "status_update") {
      await sendOrderStatusUpdateEmail(order);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Érvénytelen email típus" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/admin/orders/[id]/send-email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nem sikerült emailt küldeni" },
      { status: 500 }
    );
  }
}
