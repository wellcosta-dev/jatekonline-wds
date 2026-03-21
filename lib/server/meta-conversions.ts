import { createHash } from "node:crypto";
import type { Order } from "@/types";
import type { OrderAttributionRecord } from "@/lib/server/order-attribution";

type MetaPurchaseInput = {
  order: Order;
  attribution: OrderAttributionRecord;
};

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function sendMetaPurchaseEvent(
  input: MetaPurchaseInput
): Promise<{ sent: boolean; reason?: string }> {
  const pixelId = process.env.META_PIXEL_ID?.trim() || process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const accessToken = process.env.META_ACCESS_TOKEN?.trim();
  if (!pixelId || !accessToken) {
    return { sent: false, reason: "meta_not_configured" };
  }

  const order = input.order;
  const attribution = input.attribution;
  const eventId = attribution.purchaseEventId || `${order.orderNumber}-purchase`;
  const url = `https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(new Date(order.updatedAt || order.createdAt).getTime() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: attribution.landingPath
          ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://babyonline.hu"}${attribution.landingPath}`
          : `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://babyonline.hu"}/rendeles/megerosites`,
        user_data: {
          em: order.guestEmail ? [sha256(order.guestEmail)] : undefined,
          ph: order.shippingAddress.phone ? [sha256(order.shippingAddress.phone)] : undefined,
          fbp: attribution.fbp,
          fbc: attribution.fbc || (attribution.fbclid ? `fb.1.${Date.now()}.${attribution.fbclid}` : undefined),
        },
        custom_data: {
          currency: "HUF",
          value: Number(order.total || 0),
          order_id: order.orderNumber,
          content_type: "product",
          contents: order.items.map((item) => ({
            id: item.productId,
            quantity: item.quantity,
            item_price: item.price,
          })),
          num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
        },
      },
    ],
    test_event_code: process.env.META_TEST_EVENT_CODE?.trim() || undefined,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Meta CAPI error: ${response.status} ${text}`);
  }
  return { sent: true };
}
