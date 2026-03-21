export type ShippingMethod =
  | "gls"
  | "gls-csomagautomata"
  | "gls-csomagpont"
  | "magyar-posta";

export const SHIPPING_METHOD_LABELS: Record<ShippingMethod, string> = {
  gls: "GLS Házhozszállítás",
  "gls-csomagautomata": "GLS Csomagautomata",
  "gls-csomagpont": "GLS Csomagpont",
  "magyar-posta": "Magyar Posta",
};

export const SHIPPING_METHOD_LOGOS: Record<ShippingMethod, string> = {
  gls: "https://upload.wikimedia.org/wikipedia/commons/a/a6/GLS_Logo_2021.svg",
  "gls-csomagautomata": "https://upload.wikimedia.org/wikipedia/commons/a/a6/GLS_Logo_2021.svg",
  "gls-csomagpont": "https://upload.wikimedia.org/wikipedia/commons/a/a6/GLS_Logo_2021.svg",
  "magyar-posta": "https://upload.wikimedia.org/wikipedia/commons/6/69/Magyar_Posta_logo.svg",
};

export type GlsPickupPointType = "parcel-locker" | "parcel-shop";

export interface GlsPickupPoint {
  id: string;
  type: GlsPickupPointType;
  name: string;
  postalCode: string;
  city: string;
  address: string;
  distanceKm: number;
  openingHours?: string;
}

export interface OrderShippingPickupPoint {
  id: string;
  type: GlsPickupPointType;
  name: string;
  postalCode: string;
  city: string;
  address: string;
}

export function requiresGlsPickupPoint(method: ShippingMethod): boolean {
  return method === "gls-csomagautomata" || method === "gls-csomagpont";
}
