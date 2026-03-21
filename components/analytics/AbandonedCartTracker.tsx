"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";

function getSessionId(): string {
  const existing = window.localStorage.getItem("bo-cart-session-id");
  if (existing) return existing;
  const next = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem("bo-cart-session-id", next);
  return next;
}

export function AbandonedCartTracker() {
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal());

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      const payloadItems = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.salePrice ?? item.product.price,
        quantity: item.quantity,
      }));
      await fetch("/api/abandoned-carts/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          items: payloadItems,
          subtotal,
          clear: payloadItems.length === 0,
        }),
      }).catch(() => undefined);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [items, subtotal]);

  return null;
}
