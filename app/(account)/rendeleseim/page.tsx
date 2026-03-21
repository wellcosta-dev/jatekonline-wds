"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Feldolgozás alatt",
  CONFIRMED: "Megerősítve",
  PROCESSING: "Előkészítés",
  SHIPPED: "Kiszállítva",
  DELIVERED: "Átvéve",
  CANCELLED: "Törölve",
  REFUNDED: "Visszatérítve",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-neutral-pale text-neutral-medium",
  CONFIRMED: "bg-primary-pale text-primary",
  PROCESSING: "bg-primary-pale text-primary",
  SHIPPED: "bg-secondary/20 text-secondary",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-amber-100 text-amber-700",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getCodFee(order: Order): number {
  if (order.paymentMethod !== "cod") return 0;
  const baseTotal =
    order.subtotal - order.discount + order.shippingPrice - (order.loyaltyDiscount ?? 0);
  const fee = order.total - baseTotal;
  return fee > 0 ? fee : 0;
}

export default function RendeleseimPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const authResponse = await fetch("/api/auth/me", { cache: "no-store" });
        if (!authResponse.ok) {
          setOrders([]);
          return;
        }
        const authPayload = (await authResponse.json()) as { user?: { email?: string } };
        const email = authPayload.user?.email ?? "";
        if (!email) {
          setOrders([]);
          return;
        }
        const response = await fetch(`/api/orders?email=${encodeURIComponent(email)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as { orders: Order[] };
        setOrders(data.orders ?? []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-dark mb-6">
        Rendeléseim
      </h1>

      <div className="space-y-4">
        {loading && (
          <div className="card p-5 text-sm text-neutral-medium">Rendelések betöltése...</div>
        )}
        {!loading && orders.length === 0 && (
          <div className="card p-5 text-sm text-neutral-medium">Még nincs rendelésed.</div>
        )}
        {orders.map((order) => {
          const isExpanded = expandedId === order.id;
          const codFee = getCodFee(order);
          return (
            <motion.div
              key={order.id}
              layout
              className="card overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                className="w-full p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left hover:bg-neutral-pale/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-semibold text-neutral-dark">
                    {order.orderNumber}
                  </div>
                  <div className="text-sm text-neutral-medium">
                    {formatDate(order.createdAt)} • {order.items.length} termék
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "badge",
                      STATUS_COLORS[order.status] ?? STATUS_COLORS.PENDING
                    )}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                  <span className="font-bold text-primary">
                    {formatPrice(order.total)}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-5 text-neutral-medium transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-100 overflow-hidden"
                  >
                    <div className="p-5 space-y-4">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 py-2"
                        >
                          <div className="w-16 h-16 rounded-lg bg-neutral-pale flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-neutral-dark">
                              {item.productName}
                            </div>
                            <div className="text-sm text-neutral-medium">
                              {item.quantity} db × {formatPrice(item.price)}
                            </div>
                          </div>
                          <div className="font-semibold text-neutral-dark">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                      <div className="pt-4 border-t border-gray-100 space-y-1 text-sm">
                        <div className="flex justify-between text-neutral-medium">
                          <span>Részösszeg</span>
                          <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        {order.shippingPrice > 0 && (
                          <div className="flex justify-between text-neutral-medium">
                            <span>Szállítás</span>
                            <span>{formatPrice(order.shippingPrice)}</span>
                          </div>
                        )}
                        {codFee > 0 && (
                          <div className="flex justify-between text-neutral-medium">
                            <span>Utánvét kezelési díj</span>
                            <span>{formatPrice(codFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-neutral-dark pt-2">
                          <span>Összesen</span>
                          <span>{formatPrice(order.total)}</span>
                        </div>
                      </div>
                      {order.glsTrackingId && (
                        <div className="text-sm text-neutral-medium">
                          Követési kód: <strong>{order.glsTrackingId}</strong>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
