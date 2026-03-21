"use client";

import type { Product } from "@/types";

type EventParams = Record<string, string | number | boolean | null | undefined | unknown[]>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (command: "event", eventName: string, params?: EventParams) => void;
    fbq?: (command: string, eventName: string, params?: Record<string, unknown>, options?: Record<string, unknown>) => void;
  }
}

const hasGtmConfigured = Boolean(process.env.NEXT_PUBLIC_GTM_ID?.trim());

export function createEventId(prefix = "evt"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapToMetaEvent(
  eventName: string,
  params: EventParams
): { name: string; params: Record<string, unknown> } | null {
  const currency = String(params.currency ?? "HUF");
  const value = Number(params.value ?? 0);
  const items = Array.isArray(params.items) ? params.items : [];

  if (eventName === "view_item") {
    return { name: "ViewContent", params: { currency, value, content_type: "product", contents: items } };
  }
  if (eventName === "add_to_cart") {
    return { name: "AddToCart", params: { currency, value, content_type: "product", contents: items } };
  }
  if (eventName === "begin_checkout") {
    return { name: "InitiateCheckout", params: { currency, value, content_type: "product", contents: items } };
  }
  if (eventName === "purchase") {
    return {
      name: "Purchase",
      params: {
        currency,
        value,
        content_type: "product",
        contents: items,
        num_items: items.length,
      },
    };
  }
  return null;
}

export function trackEvent(eventName: string, params: EventParams = {}) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: eventName, ...params });

  if (!hasGtmConfigured && typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }

  const mappedMeta = mapToMetaEvent(eventName, params);
  if (mappedMeta && typeof window.fbq === "function") {
    const eventId = typeof params.event_id === "string" ? params.event_id : undefined;
    window.fbq("track", mappedMeta.name, mappedMeta.params, eventId ? { eventID: eventId } : undefined);
  }
}

export interface AnalyticsItemInput {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity?: number;
  listName?: string;
}

export function toAnalyticsItem(item: AnalyticsItemInput) {
  return {
    item_id: item.id,
    item_name: item.name,
    item_category: item.category,
    price: item.price,
    quantity: item.quantity ?? 1,
    item_list_name: item.listName,
  };
}

export function toAnalyticsItemFromProduct(
  product: Product,
  options?: { quantity?: number; listName?: string }
) {
  return toAnalyticsItem({
    id: product.id,
    name: product.name,
    category: product.categoryId,
    price: product.salePrice ?? product.price,
    quantity: options?.quantity ?? 1,
    listName: options?.listName,
  });
}
