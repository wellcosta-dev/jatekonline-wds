import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStoredOrders, saveStoredOrders } from "@/lib/server/orders";
import {
  getOrderAttributionByOrderId,
  getOrderAttributionByOrderNumber,
  markMetaPurchaseSent,
} from "@/lib/server/order-attribution";
import { sendMetaPurchaseEvent } from "@/lib/server/meta-conversions";

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!stripeSecretKey || !webhookSecret || !signature) {
      return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    let eventType = "unknown";
    let paymentIntentId = "";
    let metadataOrderId = "";
    let metadataOrderNumber = "";
    eventType = event.type;
    if (event.type.startsWith("payment_intent.")) {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      paymentIntentId = paymentIntent.id;
      metadataOrderId = paymentIntent.metadata?.orderId ?? "";
      metadataOrderNumber = paymentIntent.metadata?.orderNumber ?? "";
    } else if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : "";
      metadataOrderId = session.metadata?.orderId ?? "";
      metadataOrderNumber = session.metadata?.orderNumber ?? "";
    }

    if (!paymentIntentId && !metadataOrderId && !metadataOrderNumber) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const storedOrders = await getStoredOrders();
    const targetIndex = storedOrders.findIndex((order) =>
      (paymentIntentId && order.stripePaymentId === paymentIntentId) ||
      (metadataOrderId && order.id === metadataOrderId) ||
      (metadataOrderNumber && order.orderNumber === metadataOrderNumber)
    );

    if (targetIndex >= 0) {
      const order = storedOrders[targetIndex];
      if (eventType === "payment_intent.succeeded" || eventType === "checkout.session.completed") {
        const updatedOrder = {
          ...order,
          paymentStatus: "PAID" as const,
          stripePaymentId: paymentIntentId || order.stripePaymentId,
          status: order.status === "PENDING" ? "CONFIRMED" : order.status,
          updatedAt: new Date().toISOString(),
        };
        storedOrders[targetIndex] = updatedOrder;
        await saveStoredOrders(storedOrders);
        const attribution =
          (await getOrderAttributionByOrderId(updatedOrder.id)) ||
          (await getOrderAttributionByOrderNumber(updatedOrder.orderNumber));
        if (attribution && !attribution.metaPurchaseSentAt) {
          try {
            const result = await sendMetaPurchaseEvent({
              order: updatedOrder,
              attribution,
            });
            if (result.sent) {
              await markMetaPurchaseSent(updatedOrder.id);
            }
          } catch (metaError) {
            console.error("Meta CAPI webhook send failed:", metaError);
          }
        }
      } else if (eventType === "payment_intent.payment_failed") {
        storedOrders[targetIndex] = {
          ...order,
          paymentStatus: "FAILED" as const,
          updatedAt: new Date().toISOString(),
        };
        await saveStoredOrders(storedOrders);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("POST /api/payments/webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
