import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus } from "@/types";
import { getOrderById, upsertStoredOrder } from "@/lib/server/orders";
import { sendOrderStatusUpdateEmail } from "@/lib/email/sender";
import { getLoyaltySettings } from "@/lib/loyalty/settings";
import { awardLoyaltyPoints } from "@/lib/server/loyalty";
import { requireAdmin } from "@/lib/server/api-auth";

type RouteParams = { params: Promise<{ id: string }> };

const VALID_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const newStatus = body.status as OrderStatus | undefined;

    if (newStatus && !VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const updated = {
      ...order,
      ...body,
      status: newStatus ?? order.status,
      updatedAt: new Date().toISOString(),
    };

    if (
      newStatus === "DELIVERED" &&
      order.status !== "DELIVERED" &&
      !order.loyaltyPointsGranted &&
      order.guestEmail
    ) {
      const loyaltySettings = await getLoyaltySettings();
      if (loyaltySettings.enabled && loyaltySettings.earnOnDelivered) {
        const earned = Math.floor(order.total / loyaltySettings.earnDivisor);
        if (earned > 0) {
          await awardLoyaltyPoints(order.guestEmail, earned);
        }
        updated.loyaltyPointsEarned = earned;
        updated.loyaltyPointsGranted = true;
      }
    }

    if (newStatus === "CONFIRMED" && !updated.billingoInvoiceId) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/billing/billingo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: updated.orderNumber,
            customerEmail: updated.guestEmail,
            total: updated.total,
          }),
        });
        if (response.ok) {
          const payload = (await response.json()) as { id?: string; invoiceId?: string };
          updated.billingoInvoiceId = payload.invoiceId ?? payload.id ?? updated.billingoInvoiceId;
        }
      } catch (invoiceError) {
        console.error("Invoice automation failed:", invoiceError);
      }
    }

    if (newStatus === "SHIPPED" && !updated.glsTrackingId && !updated.postaTrackingId) {
      const shippingProvider = updated.shippingMethod.startsWith("gls") ? "gls" : "magyar-posta";
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/shipping/${shippingProvider}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: updated.orderNumber,
            shippingAddress: updated.shippingAddress,
            shippingMethod: updated.shippingMethod,
          }),
        });
        if (response.ok) {
          const payload = (await response.json()) as { trackingId?: string };
          if (shippingProvider === "gls") {
            updated.glsTrackingId = payload.trackingId ?? updated.glsTrackingId;
          } else {
            updated.postaTrackingId = payload.trackingId ?? updated.postaTrackingId;
          }
        }
      } catch (shippingError) {
        console.error("Shipping automation failed:", shippingError);
      }
    }

    await upsertStoredOrder(updated);

    if (newStatus && newStatus !== order.status) {
      try {
        await sendOrderStatusUpdateEmail(updated);
      } catch (mailError) {
        console.error("Status updated but email sending failed:", mailError);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
