import { NextRequest, NextResponse } from "next/server";
import type { GlsPickupPoint, GlsPickupPointType } from "@/lib/shipping";

const GLS_POINTS_URL = "https://map.gls-hungary.com/data/deliveryPoints/hu.json";

function isPickupPointType(value: string | null): value is GlsPickupPointType {
  return value === "parcel-locker" || value === "parcel-shop";
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

interface RawGlsPoint {
  id?: string;
  name?: string;
  type?: string;
  contact?: {
    postalCode?: string;
    city?: string;
    address?: string;
  };
  location?: [number, number];
  hours?: Array<[number, string, string]>;
}

function toOpeningHours(hours: RawGlsPoint["hours"]): string | undefined {
  if (!Array.isArray(hours) || hours.length === 0) return undefined;
  const first = hours[0];
  if (!Array.isArray(first) || first.length < 3) return undefined;
  return `${first[1]}-${first[2]}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const query = normalize(searchParams.get("query") ?? "");
    const postalCode = normalize(searchParams.get("postalCode") ?? "");
    const city = normalize(searchParams.get("city") ?? "");
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    if (!isPickupPointType(typeParam)) {
      return NextResponse.json(
        { error: "Invalid or missing 'type'. Use parcel-locker or parcel-shop." },
        { status: 400 }
      );
    }

    const response = await fetch(GLS_POINTS_URL, {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`GLS delivery point source failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { items?: RawGlsPoint[] };
    const rawItems = payload.items ?? [];

    const points = rawItems
      .filter((item) => item.type === typeParam)
      .map((item): GlsPickupPoint | null => {
        if (!item.id || !item.name || !item.contact?.postalCode || !item.contact.city || !item.contact.address) {
          return null;
        }
        return {
          id: item.id,
          type: item.type === "parcel-locker" ? "parcel-locker" : "parcel-shop",
          name: item.name,
          postalCode: item.contact.postalCode,
          city: item.contact.city,
          address: item.contact.address,
          distanceKm: 0,
          openingHours: toOpeningHours(item.hours),
        };
      })
      .filter((point): point is GlsPickupPoint => Boolean(point))
      .filter((point) => {
        if (!query) return true;
        const haystack = normalize(
          `${point.name} ${point.city} ${point.address} ${point.postalCode}`
        );
        return haystack.includes(query);
      })
      .filter((point) => {
        if (!postalCode) return true;
        return normalize(point.postalCode).startsWith(postalCode);
      })
      .filter((point) => {
        if (!city) return true;
        return normalize(point.city).includes(city);
      })
      .slice(0, limit);

    return NextResponse.json({ points });
  } catch (error) {
    console.error("GET /api/shipping/gls/pickup-points error:", error);
    return NextResponse.json(
      { error: "Failed to fetch GLS pickup points" },
      { status: 500 }
    );
  }
}
