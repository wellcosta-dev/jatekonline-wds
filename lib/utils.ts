import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function calculateDiscount(price: number, salePrice: number): number {
  return Math.round(((price - salePrice) / price) * 100);
}

export function slugify(text: string): string {
  const hungarianMap: Record<string, string> = {
    á: "a", é: "e", í: "i", ó: "o", ö: "o", ő: "o",
    ú: "u", ü: "u", ű: "u", Á: "a", É: "e", Í: "i",
    Ó: "o", Ö: "o", Ő: "o", Ú: "u", Ü: "u", Ű: "u",
  };

  return text
    .split("")
    .map((char) => hungarianMap[char] || char)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

export function generateOrderNumber(): string {
  const prefix = "BO";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export const FREE_SHIPPING_THRESHOLD = 20000;

export function getShippingCost(subtotal: number, method: string): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  switch (method) {
    case "gls":
      return 2390;
    case "gls-csomagautomata":
      return 990;
    case "gls-csomagpont":
      return 990;
    case "magyar-posta":
      return 2390;
    default:
      return 2390;
  }
}
