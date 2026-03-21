import { NextRequest, NextResponse } from "next/server";
import { mockOrders } from "@/lib/mock-data";
import {
  renderAdminNewOrderTemplate,
  renderOrderConfirmationTemplate,
  renderOrderStatusUpdateTemplate,
} from "@/lib/email/templates";
import { requireAdmin } from "@/lib/server/api-auth";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const type = request.nextUrl.searchParams.get("type");
    const order = mockOrders[0];

    if (!order) {
      return NextResponse.json({ error: "Nincs minta rendelés" }, { status: 500 });
    }

    if (type === "order_confirmation") {
      return NextResponse.json(renderOrderConfirmationTemplate(order));
    }
    if (type === "order_status_update") {
      return NextResponse.json(renderOrderStatusUpdateTemplate({ ...order, status: "SHIPPED" }));
    }
    if (type === "admin_new_order") {
      return NextResponse.json(renderAdminNewOrderTemplate(order));
    }

    return NextResponse.json({ error: "Ismeretlen template típus" }, { status: 400 });
  } catch (error) {
    console.error("GET /api/admin/email-templates error:", error);
    return NextResponse.json({ error: "Nem sikerült betölteni a sablont" }, { status: 500 });
  }
}
