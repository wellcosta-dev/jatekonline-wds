import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/api-auth";
import { getOrderById, upsertStoredOrder } from "@/lib/server/orders";

type RouteParams = { params: Promise<{ id: string }> };

type NormalizedLabelResult = {
  trackingId?: string;
  labelUrl?: string;
  labelBase64?: string;
  labelContentType?: string;
  raw: unknown;
};

function isGlsShippingMethod(value: string): boolean {
  return value === "gls" || value === "gls-csomagautomata" || value === "gls-csomagpont";
}

function tryGetString(input: unknown, paths: Array<Array<string | number>>): string | undefined {
  for (const path of paths) {
    let current: unknown = input;
    let valid = true;
    for (const key of path) {
      if (typeof key === "number") {
        if (!Array.isArray(current) || current.length <= key) {
          valid = false;
          break;
        }
        current = current[key];
        continue;
      }
      if (!current || typeof current !== "object" || !(key in (current as Record<string, unknown>))) {
        valid = false;
        break;
      }
      current = (current as Record<string, unknown>)[key];
    }
    if (!valid) continue;
    if (typeof current === "string" && current.trim()) return current.trim();
  }
  return undefined;
}

function normalizeResponse(payload: unknown): NormalizedLabelResult {
  const trackingId = tryGetString(payload, [
    ["trackingId"],
    ["tracking_id"],
    ["parcelNumber"],
    ["parcel_number"],
    ["shipmentId"],
    ["shipment_id"],
    ["consignmentNumber"],
    ["labels", 0, "trackingId"],
    ["labels", 0, "parcelNumber"],
    ["data", "trackingId"],
    ["data", "parcelNumber"],
  ]);

  const labelUrl = tryGetString(payload, [
    ["labelUrl"],
    ["label_url"],
    ["pdfUrl"],
    ["pdf_url"],
    ["label", "url"],
    ["label", "pdfUrl"],
    ["labels", 0, "url"],
    ["labels", 0, "pdfUrl"],
    ["data", "labelUrl"],
    ["data", "pdfUrl"],
  ]);

  const labelBase64 = tryGetString(payload, [
    ["labelPdfBase64"],
    ["label_base64"],
    ["pdfBase64"],
    ["pdf_base64"],
    ["label", "base64"],
    ["labels", 0, "base64"],
    ["data", "labelPdfBase64"],
  ]);

  const labelContentType = tryGetString(payload, [
    ["labelContentType"],
    ["contentType"],
    ["label", "contentType"],
    ["data", "labelContentType"],
  ]);

  return {
    trackingId,
    labelUrl,
    labelBase64,
    labelContentType,
    raw: payload,
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "A rendelés nem található." }, { status: 404 });
    }
    if (!isGlsShippingMethod(order.shippingMethod)) {
      return NextResponse.json(
        { error: "A GLS matrica csak GLS szállítási módnál generálható." },
        { status: 400 }
      );
    }

    const glsPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      shippingMethod: order.shippingMethod,
      shippingPickupPoint: order.shippingPickupPoint,
      recipient: {
        name: order.shippingAddress.name,
        email: order.shippingAddress.email || order.guestEmail,
        phone: order.shippingAddress.phone,
        country: order.shippingAddress.country,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        street: order.shippingAddress.street,
      },
      codAmount: order.paymentMethod === "cod" ? order.total : 0,
      packageCount: 1,
      parcelWeightKg: 1,
      reference: order.orderNumber,
      items: order.items.map((item) => ({
        name: item.productName,
        sku: item.productId,
        quantity: item.quantity,
      })),
    };

    const glsResponse = await fetch(`${request.nextUrl.origin}/api/shipping/gls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(glsPayload),
      cache: "no-store",
    });

    const glsResult = (await glsResponse.json()) as unknown;
    if (!glsResponse.ok) {
      return NextResponse.json(
        {
          error: "GLS címkegenerálás sikertelen.",
          details: glsResult,
        },
        { status: glsResponse.status === 501 ? 501 : 502 }
      );
    }

    const normalized = normalizeResponse(glsResult);
    if (!normalized.trackingId && !normalized.labelUrl && !normalized.labelBase64) {
      return NextResponse.json(
        {
          error: "A GLS válasz nem tartalmaz címke vagy tracking adatot.",
          details: glsResult,
        },
        { status: 502 }
      );
    }

    const updatedOrder = {
      ...order,
      glsTrackingId: normalized.trackingId ?? order.glsTrackingId,
      updatedAt: new Date().toISOString(),
    };
    await upsertStoredOrder(updatedOrder);

    return NextResponse.json({
      ok: true,
      trackingId: updatedOrder.glsTrackingId,
      labelUrl: normalized.labelUrl,
      labelBase64: normalized.labelBase64,
      labelContentType: normalized.labelContentType ?? "application/pdf",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("POST /api/admin/orders/[id]/gls-label error:", error);
    return NextResponse.json(
      { error: "A GLS matrica generálása sikertelen." },
      { status: 500 }
    );
  }
}
