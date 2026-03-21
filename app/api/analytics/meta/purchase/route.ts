import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getStoredOrders } from "@/lib/server/orders";
import {
  getOrderAttributionByOrderId,
  getOrderAttributionByOrderNumber,
  markMetaPurchaseSent,
  upsertOrderAttribution,
} from "@/lib/server/order-attribution";
import { sendMetaPurchaseEvent } from "@/lib/server/meta-conversions";

type Payload = {
  orderId?: string;
  orderNumber?: string;
  force?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const body = (await request.json()) as Payload;
    const targetOrderId = String(body.orderId ?? "").trim();
    const targetOrderNumber = String(body.orderNumber ?? "").trim();
    if (!targetOrderId && !targetOrderNumber) {
      return NextResponse.json({ error: "orderId vagy orderNumber kötelező." }, { status: 400 });
    }

    const orders = await getStoredOrders();
    const order = orders.find(
      (entry) =>
        (targetOrderId && entry.id === targetOrderId) ||
        (targetOrderNumber && entry.orderNumber === targetOrderNumber)
    );
    if (!order) {
      return NextResponse.json({ error: "Rendelés nem található." }, { status: 404 });
    }

    const attribution =
      (await getOrderAttributionByOrderId(order.id)) ||
      (await getOrderAttributionByOrderNumber(order.orderNumber));
    if (!attribution) {
      return NextResponse.json({ error: "Nincs rendelés attribúciós rekord." }, { status: 404 });
    }

    if (attribution.metaPurchaseSentAt && !body.force) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "already_sent",
        sentAt: attribution.metaPurchaseSentAt,
      });
    }

    const result = await sendMetaPurchaseEvent({ order, attribution });
    if (!result.sent) {
      return NextResponse.json({ ok: false, reason: result.reason ?? "send_skipped" }, { status: 409 });
    }

    await markMetaPurchaseSent(order.id);
    await upsertOrderAttribution({
      ...attribution,
      orderId: order.id,
      orderNumber: order.orderNumber,
      metaPurchaseSentAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (error) {
    console.error("POST /api/analytics/meta/purchase error:", error);
    return NextResponse.json(
      { error: "Meta purchase esemény küldése sikertelen." },
      { status: 500 }
    );
  }
}
