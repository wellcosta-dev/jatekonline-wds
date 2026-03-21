import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSiteUrl } from "@/lib/seo";
import { getOrderById, upsertStoredOrder } from "@/lib/server/orders";
import { getOrderAttributionByOrderId } from "@/lib/server/order-attribution";

function toStripeMinorUnits(value: number, currency: string): number {
  // This Stripe account expects HUF amounts with two decimals in Checkout.
  // Example: 8 480 Ft -> 848000.
  if (currency === "huf") return Math.round(value * 100);
  return Math.round(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const currency = String(body.currency ?? "huf").toLowerCase();
    const orderId = String(body.orderId ?? "");
    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "A rendelés nem található." }, { status: 404 });
    }
    const amount = Math.max(0, Math.round(Number(order.total ?? 0)));
    const amountMinor = toStripeMinorUnits(amount, currency);
    const orderNumber = order.orderNumber;
    const email = order.guestEmail ?? "";
    const siteUrl = getSiteUrl();
    const attribution = await getOrderAttributionByOrderId(order.id);
    const successParams = new URLSearchParams({
      order: orderNumber,
      v: String(amount),
      c: String(currency).toUpperCase(),
    });
    if (attribution?.purchaseEventId) {
      successParams.set("eid", attribution.purchaseEventId);
    }
    const successUrl = `${siteUrl}/rendeles/megerosites?${successParams.toString()}`;
    const cancelUrl = `${siteUrl}/rendeles`;

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Az összegnek nagyobbnak kell lennie 0-nál." },
        { status: 400 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "A Stripe nincs konfigurálva." }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const lineItems = [
      {
        quantity: 1,
        price_data: {
          currency,
          product_data: {
            name: `BabyOnline rendelés (${orderNumber})`,
            description: `Termékek: ${order.items.length} db • Szállítás: ${order.shippingMethod}`,
          },
          unit_amount: amountMinor,
        },
      },
    ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: lineItems,
      customer_email: email || undefined,
      payment_method_types: ["card"],
      metadata: {
        orderId,
        orderNumber,
        email,
      },
      payment_intent_data: {
        metadata: {
          orderId,
          orderNumber,
          email,
        },
      },
    });

    await upsertStoredOrder({
      ...order,
      paymentStatus: "PENDING",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      checkoutSessionId: session.id,
      amount,
      currency,
      mode: stripeSecretKey.startsWith("sk_live_") ? "live" : "test",
    });
  } catch (error) {
    console.error("POST /api/payments/stripe error:", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to create payment intent";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
