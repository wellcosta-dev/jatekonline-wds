import { NextRequest, NextResponse } from "next/server";
import type { Order, OrderItem, Address } from "@/types";
import { generateOrderNumber } from "@/lib/utils";
import { getOrders, upsertStoredOrder } from "@/lib/server/orders";
import { sendAdminNewOrderEmail, sendOrderConfirmationEmail } from "@/lib/email/sender";
import { getLoyaltySettings } from "@/lib/loyalty/settings";
import { awardLoyaltyPoints, getLoyaltyBalance, redeemLoyaltyPoints } from "@/lib/server/loyalty";
import { getEffectiveProducts } from "@/lib/server/products";
import { getShippingCost } from "@/lib/utils";
import type { ShippingMethod } from "@/lib/shipping";
import { getSessionUser } from "@/lib/server/api-auth";
import { markAbandonedCartRecoveredByEmail } from "@/lib/server/abandoned-carts";
import { sendMetaPurchaseEvent } from "@/lib/server/meta-conversions";
import { upsertOrderAttribution } from "@/lib/server/order-attribution";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    const emailFilter = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
    const orders = await getOrders();

    if (session?.role === "ADMIN") {
      return NextResponse.json({ orders });
    }

    if (!emailFilter) {
      return NextResponse.json({ orders: [] });
    }

    const filtered = orders.filter(
      (order) => order.guestEmail?.trim().toLowerCase() === emailFilter
    );
    return NextResponse.json({ orders: filtered });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

const COD_FEE = 990;

function computeCouponDiscount(subtotal: number, couponCode: string | undefined): number {
  if (!couponCode) return 0;
  const code = couponCode.trim().toUpperCase();
  let percent = 0;
  if (code === "BABA10") percent = 10;
  else if (code === "UJSZULOTT") percent = 15;
  if (percent <= 0) return 0;
  return Math.round((subtotal * percent) / 100);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Order must have at least one item" },
        { status: 400 }
      );
    }

    if (!body.shippingAddress) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    const shippingAddress = body.shippingAddress as Address;
    if (
      !shippingAddress.name ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.postalCode ||
      !shippingAddress.country
    ) {
      return NextResponse.json(
        { error: "Shipping address must include name, street, city, postalCode, country" },
        { status: 400 }
      );
    }

    const providedOrderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
    const providedOrderId = typeof body.id === "string" ? body.id.trim() : "";
    const orderNumber = providedOrderNumber || generateOrderNumber();
    const id = providedOrderId || `ord-${Date.now()}`;
    const now = new Date().toISOString();

    const availableProducts = await getEffectiveProducts();
    const items: OrderItem[] = body.items
      .map((item: Partial<OrderItem>, idx: number) => {
        const product = availableProducts.find((entry) => entry.id === item.productId);
        if (!product) return null;
        const requestedQuantity = Number(item.quantity ?? 1);
        const maxQuantity = product.stock > 0 ? product.stock : 99;
        const quantity = Math.max(1, Math.min(maxQuantity, Math.floor(requestedQuantity)));
        const unitPrice = product.salePrice ?? product.price;
        return {
          id: `oi-${id}-${idx}`,
          productId: product.id,
          productName: product.name,
          productImage: product.images?.[0] ?? "/images/placeholder.jpg",
          price: unitPrice,
          quantity,
          variant: item.variant,
        } as OrderItem;
      })
      .filter((item: OrderItem | null): item is OrderItem => Boolean(item));

    if (items.length === 0) {
      return NextResponse.json(
        { error: "A rendelésben nincs érvényes termék." },
        { status: 400 }
      );
    }

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const couponCode = typeof body.couponCode === "string" ? body.couponCode : undefined;
    const discount = computeCouponDiscount(subtotal, couponCode);
    const shippingMethod = (body.shippingMethod ?? "gls") as ShippingMethod;
    const shippingPrice = getShippingCost(subtotal, shippingMethod);
    const codFee = body.paymentMethod === "cod" ? COD_FEE : 0;
    const computedTotal = Math.max(0, subtotal - discount + shippingPrice + codFee);
    const loyaltySettings = await getLoyaltySettings();
    const requestedPoints = Math.max(0, Number(body.loyaltyPointsRedeemed ?? 0));
    let loyaltyPointsRedeemed = 0;
    let loyaltyDiscount = 0;

    if (loyaltySettings.enabled && requestedPoints > 0 && body.guestEmail) {
      const balance = await getLoyaltyBalance(String(body.guestEmail));
      const maxByBalance = balance.points;
      const maxByTotal = Math.floor(computedTotal / loyaltySettings.pointValueHuf);
      const maxByPercent = Math.floor(
        (computedTotal * loyaltySettings.maxRedeemPercent) /
          100 /
          loyaltySettings.pointValueHuf
      );
      const allowed = Math.max(0, Math.min(maxByBalance, maxByTotal, maxByPercent));
      loyaltyPointsRedeemed = Math.min(requestedPoints, allowed);
      loyaltyDiscount = loyaltyPointsRedeemed * loyaltySettings.pointValueHuf;
    }

    const total = Math.max(0, computedTotal - loyaltyDiscount);

    const paymentMethod = body.paymentMethod ?? "card";
    const purchaseEventId = typeof body.purchaseEventId === "string" ? body.purchaseEventId : undefined;
    const attribution = body.attribution as
      | {
          fbp?: string;
          fbc?: string;
          fbclid?: string;
          gclid?: string;
          utmSource?: string;
          utmMedium?: string;
          utmCampaign?: string;
          utmTerm?: string;
          utmContent?: string;
          landingPath?: string;
        }
      | undefined;
    const paymentStatusFromBody = String(body.paymentStatus ?? "");
    const safePaymentStatus =
      paymentStatusFromBody === "PAID" ||
      paymentStatusFromBody === "PENDING" ||
      paymentStatusFromBody === "FAILED" ||
      paymentStatusFromBody === "REFUNDED"
        ? paymentStatusFromBody
        : paymentMethod === "card"
          ? "PENDING"
          : "PENDING";

    const order: Order = {
      id,
      orderNumber,
      userId: body.userId,
      guestEmail: body.guestEmail,
      status: "PENDING",
      items,
      shippingAddress,
      billingAddress: (body.billingAddress as Address) ?? shippingAddress,
      shippingMethod,
      shippingPickupPoint: body.shippingPickupPoint,
      shippingPrice,
      subtotal,
      discount,
      couponCode,
      total,
      paymentMethod,
      paymentStatus: safePaymentStatus,
      purchaseEventId,
      stripePaymentId: typeof body.stripePaymentId === "string" ? body.stripePaymentId : undefined,
      notes: body.notes,
      loyaltyPointsRedeemed,
      loyaltyDiscount,
      loyaltyPointsGranted: false,
      attribution: attribution
        ? {
            fbp: attribution.fbp,
            fbc: attribution.fbc,
            fbclid: attribution.fbclid,
            gclid: attribution.gclid,
            utmSource: attribution.utmSource,
            utmMedium: attribution.utmMedium,
            utmCampaign: attribution.utmCampaign,
            utmTerm: attribution.utmTerm,
            utmContent: attribution.utmContent,
            landingPath: attribution.landingPath,
          }
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    let loyaltyWasRedeemed = false;
    if (loyaltyPointsRedeemed > 0 && order.guestEmail) {
      await redeemLoyaltyPoints(order.guestEmail, loyaltyPointsRedeemed);
      loyaltyWasRedeemed = true;
    }

    try {
      await upsertStoredOrder(order);
      await upsertOrderAttribution({
        orderId: order.id,
        orderNumber: order.orderNumber,
        purchaseEventId,
        fbp: attribution?.fbp,
        fbc: attribution?.fbc,
        fbclid: attribution?.fbclid,
        gclid: attribution?.gclid,
        utmSource: attribution?.utmSource,
        utmMedium: attribution?.utmMedium,
        utmCampaign: attribution?.utmCampaign,
        utmTerm: attribution?.utmTerm,
        utmContent: attribution?.utmContent,
        landingPath: attribution?.landingPath,
      });
      if (order.guestEmail) {
        await markAbandonedCartRecoveredByEmail(order.guestEmail, order.orderNumber);
      }
    } catch (storageError) {
      if (loyaltyWasRedeemed && order.guestEmail && loyaltyPointsRedeemed > 0) {
        await awardLoyaltyPoints(order.guestEmail, loyaltyPointsRedeemed);
      }
      throw storageError;
    }

    // Do not block checkout response on email delivery to avoid gateway timeouts.
    Promise.allSettled([
      sendOrderConfirmationEmail(order),
      sendAdminNewOrderEmail(order),
    ]).then((results) => {
      for (const result of results) {
        if (result.status === "rejected") {
          console.error("Order created but email sending failed:", result.reason);
        }
      }
    });

    if (paymentMethod === "cod") {
      Promise.resolve()
        .then(async () => {
          const orderAttribution = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            purchaseEventId,
            fbp: attribution?.fbp,
            fbc: attribution?.fbc,
            fbclid: attribution?.fbclid,
            gclid: attribution?.gclid,
            utmSource: attribution?.utmSource,
            utmMedium: attribution?.utmMedium,
            utmCampaign: attribution?.utmCampaign,
            utmTerm: attribution?.utmTerm,
            utmContent: attribution?.utmContent,
            landingPath: attribution?.landingPath,
            updatedAt: new Date().toISOString(),
          };
          await sendMetaPurchaseEvent({ order, attribution: orderAttribution });
          await upsertOrderAttribution({
            ...orderAttribution,
            metaPurchaseSentAt: new Date().toISOString(),
          });
        })
        .catch((metaError) => {
          console.error("Meta CAPI COD send failed:", metaError);
        });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
