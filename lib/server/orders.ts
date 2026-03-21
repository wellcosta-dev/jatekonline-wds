import type { Order } from "@/types";
import { readJsonFile, writeJsonFile } from "@/lib/server/storage";
import { getPrismaClient } from "@/lib/server/db";

const ORDERS_FILE = "orders.json";

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function mapDbOrder(order: any): Order {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId ?? undefined,
    guestEmail: order.guestEmail ?? undefined,
    status: order.status,
    items: (order.items ?? []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      price: toNumber(item.price),
      quantity: item.quantity,
      variant: item.variant ?? undefined,
    })),
    shippingAddress: order.shippingAddress as Order["shippingAddress"],
    billingAddress: order.billingAddress as Order["billingAddress"],
    shippingMethod: order.shippingMethod,
    shippingPickupPoint: (order.shippingPickupPoint as Order["shippingPickupPoint"]) ?? undefined,
    shippingPrice: toNumber(order.shippingPrice),
    subtotal: toNumber(order.subtotal),
    discount: toNumber(order.discount),
    couponCode: order.couponCode ?? undefined,
    total: toNumber(order.total),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    purchaseEventId: order.purchaseEventId ?? undefined,
    stripePaymentId: order.stripePaymentId ?? undefined,
    billingoInvoiceId: order.billingoInvoiceId ?? undefined,
    glsTrackingId: order.glsTrackingId ?? undefined,
    postaTrackingId: order.postaTrackingId ?? undefined,
    notes: order.notes ?? undefined,
    loyaltyPointsRedeemed: order.loyaltyPointsRedeemed ?? undefined,
    loyaltyDiscount: order.loyaltyDiscount ? toNumber(order.loyaltyDiscount) : undefined,
    loyaltyPointsEarned: order.loyaltyPointsEarned ?? undefined,
    loyaltyPointsGranted: order.loyaltyPointsGranted ?? undefined,
    attribution: (order.attribution as Order["attribution"]) ?? undefined,
    createdAt: new Date(order.createdAt).toISOString(),
    updatedAt: new Date(order.updatedAt).toISOString(),
  };
}

export async function getOrders(): Promise<Order[]> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const dbOrders = await prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      return dbOrders.map(mapDbOrder);
    } catch (error) {
      console.error("Prisma getOrders fallback to JSON:", error);
    }
  }
  const stored = await readJsonFile<Order[]>(ORDERS_FILE, []);
  return stored.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getStoredOrders(): Promise<Order[]> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const dbOrders = await prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      if (dbOrders.length === 0) {
        const fileOrders = await readJsonFile<Order[]>(ORDERS_FILE, []);
        if (fileOrders.length > 0) {
          for (const order of fileOrders) {
            await upsertStoredOrder(order);
          }
          return fileOrders;
        }
      }
      return dbOrders.map(mapDbOrder);
    } catch (error) {
      console.error("Prisma getStoredOrders fallback to JSON:", error);
    }
  }
  return readJsonFile<Order[]>(ORDERS_FILE, []);
}

export async function saveStoredOrders(orders: Order[]): Promise<void> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      for (const order of orders) {
        await upsertStoredOrder(order);
      }
      return;
    } catch (error) {
      console.error("Prisma saveStoredOrders fallback to JSON:", error);
    }
  }
  await writeJsonFile(ORDERS_FILE, orders);
}

export async function upsertStoredOrder(order: Order): Promise<void> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.order.upsert({
          where: { orderNumber: order.orderNumber },
          create: {
            id: order.id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            guestEmail: order.guestEmail,
            status: order.status,
            shippingAddress: order.shippingAddress as any,
            billingAddress: order.billingAddress as any,
            shippingMethod: order.shippingMethod,
            shippingPickupPoint: (order.shippingPickupPoint as any) ?? undefined,
            shippingPrice: order.shippingPrice,
            subtotal: order.subtotal,
            discount: order.discount,
            total: order.total,
            couponCode: order.couponCode,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            purchaseEventId: order.purchaseEventId,
            attribution: (order.attribution as any) ?? undefined,
            stripePaymentId: order.stripePaymentId,
            billingoInvoiceId: order.billingoInvoiceId,
            glsTrackingId: order.glsTrackingId,
            postaTrackingId: order.postaTrackingId,
            notes: order.notes,
            loyaltyPointsRedeemed: order.loyaltyPointsRedeemed,
            loyaltyDiscount: order.loyaltyDiscount,
            loyaltyPointsEarned: order.loyaltyPointsEarned,
            loyaltyPointsGranted: order.loyaltyPointsGranted ?? false,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
          },
          update: {
            userId: order.userId,
            guestEmail: order.guestEmail,
            status: order.status,
            shippingAddress: order.shippingAddress as any,
            billingAddress: order.billingAddress as any,
            shippingMethod: order.shippingMethod,
            shippingPickupPoint: (order.shippingPickupPoint as any) ?? undefined,
            shippingPrice: order.shippingPrice,
            subtotal: order.subtotal,
            discount: order.discount,
            total: order.total,
            couponCode: order.couponCode,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            purchaseEventId: order.purchaseEventId,
            attribution: (order.attribution as any) ?? undefined,
            stripePaymentId: order.stripePaymentId,
            billingoInvoiceId: order.billingoInvoiceId,
            glsTrackingId: order.glsTrackingId,
            postaTrackingId: order.postaTrackingId,
            notes: order.notes,
            loyaltyPointsRedeemed: order.loyaltyPointsRedeemed,
            loyaltyDiscount: order.loyaltyDiscount,
            loyaltyPointsEarned: order.loyaltyPointsEarned,
            loyaltyPointsGranted: order.loyaltyPointsGranted ?? false,
            updatedAt: new Date(order.updatedAt),
          },
        });
        const dbOrder = await tx.order.findUnique({ where: { orderNumber: order.orderNumber } });
        if (!dbOrder) return;
        await tx.orderItem.deleteMany({ where: { orderId: dbOrder.id } });
        if (order.items.length > 0) {
          await tx.orderItem.createMany({
            data: order.items.map((item) => ({
              id: item.id,
              orderId: dbOrder.id,
              productId: item.productId,
              productName: item.productName,
              productImage: item.productImage,
              price: item.price,
              quantity: item.quantity,
              variant: (item.variant as any) ?? undefined,
            })),
          });
        }
      });
      return;
    } catch (error) {
      console.error("Prisma upsertStoredOrder fallback to JSON:", error);
    }
  }
  const current = await readJsonFile<Order[]>(ORDERS_FILE, []);
  const index = current.findIndex(
    (entry) => entry.id === order.id || entry.orderNumber === order.orderNumber
  );
  if (index >= 0) {
    current[index] = order;
  } else {
    current.unshift(order);
  }
  await writeJsonFile(ORDERS_FILE, current);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const all = await getOrders();
  return all.find((order) => order.id === id);
}
