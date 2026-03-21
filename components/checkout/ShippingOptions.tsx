"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Truck, Mail, Package, ArrowLeft, ArrowRight, Check, MapPin, X, Loader2, RefreshCw } from "lucide-react";
import { cn, formatPrice, FREE_SHIPPING_THRESHOLD, getShippingCost } from "@/lib/utils";
import {
  requiresGlsPickupPoint,
  SHIPPING_METHOD_LOGOS,
  SHIPPING_METHOD_LABELS,
  type GlsPickupPoint,
  type ShippingMethod,
} from "@/lib/shipping";

const OPTIONS: {
  id: ShippingMethod;
  name: string;
  description: string;
  estimatedDays: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}[] = [
  {
    id: "gls",
    name: SHIPPING_METHOD_LABELS.gls,
    description: "Házhoz szállítás futárral",
    estimatedDays: "1-2 munkanap",
    icon: Truck,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "gls-csomagautomata",
    name: SHIPPING_METHOD_LABELS["gls-csomagautomata"],
    description: "Átvétel GLS automatából",
    estimatedDays: "1-2 munkanap",
    icon: Package,
    color: "text-brand-cyan",
    bgColor: "bg-brand-cyan/10",
  },
  {
    id: "gls-csomagpont",
    name: SHIPPING_METHOD_LABELS["gls-csomagpont"],
    description: "Átvétel GLS átvevőponton",
    estimatedDays: "1-2 munkanap",
    icon: MapPin,
    color: "text-brand-pink",
    bgColor: "bg-brand-pink/10",
  },
  {
    id: "magyar-posta",
    name: SHIPPING_METHOD_LABELS["magyar-posta"],
    description: "Postai kézbesítés",
    estimatedDays: "2-4 munkanap",
    icon: Mail,
    color: "text-brand-cyan",
    bgColor: "bg-brand-cyan/10",
  },
];

interface ShippingOptionsProps {
  subtotal: number;
  selectedMethod: ShippingMethod | null;
  onSelect: (method: ShippingMethod) => void;
  selectedPickupPoint: GlsPickupPoint | null;
  onSelectPickupPoint: (point: GlsPickupPoint) => void;
  onBack: () => void;
  onNext: () => void;
}

export function ShippingOptions({
  subtotal,
  selectedMethod,
  onSelect,
  selectedPickupPoint,
  onSelectPickupPoint,
  onBack,
  onNext,
}: ShippingOptionsProps) {
  const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackPoints, setFallbackPoints] = useState<GlsPickupPoint[]>([]);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const onSelectPickupPointRef = useRef(onSelectPickupPoint);

  const pickupType = useMemo<"parcel-locker" | "parcel-shop" | null>(() => {
    if (selectedMethod === "gls-csomagautomata") return "parcel-locker";
    if (selectedMethod === "gls-csomagpont") return "parcel-shop";
    return null;
  }, [selectedMethod]);

  const needsPickupPoint = selectedMethod ? requiresGlsPickupPoint(selectedMethod) : false;

  useEffect(() => {
    onSelectPickupPointRef.current = onSelectPickupPoint;
  }, [onSelectPickupPoint]);

  useEffect(() => {
    if (needsPickupPoint) {
      setIsMapOpen(true);
      return;
    }
    setIsMapOpen(false);
    setMapLoadError(null);
  }, [needsPickupPoint]);

  useEffect(() => {
    if (!isMapOpen || !needsPickupPoint || !pickupType || !isScriptReady) return;
    const host = mapHostRef.current;
    if (!host) return;

    host.innerHTML = "";
    const widget = document.createElement("gls-dpm");
    widget.setAttribute("country", "HU");
    widget.setAttribute("language", "HU");
    widget.setAttribute("filter-type", pickupType);
    widget.setAttribute("ui-filters", "default");
    widget.setAttribute("style", "display:block;height:100%;width:100%;");

    const handleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        id?: string;
        name?: string;
        type?: string;
        contact?: {
          postalCode?: string;
          city?: string;
          address?: string;
        };
      }>;
      const detail = customEvent.detail;
      if (!detail?.id || !detail?.name || !detail.contact) return;
      onSelectPickupPointRef.current({
        id: String(detail.id),
        type: detail.type === "parcel-locker" ? "parcel-locker" : "parcel-shop",
        name: String(detail.name),
        postalCode: String(detail.contact.postalCode ?? ""),
        city: String(detail.contact.city ?? ""),
        address: String(detail.contact.address ?? ""),
        distanceKm: 0,
      });
      setIsMapOpen(false);
    };

    widget.addEventListener("change", handleChange as EventListener);
    host.appendChild(widget);

    return () => {
      widget.removeEventListener("change", handleChange as EventListener);
      host.innerHTML = "";
    };
  }, [isMapOpen, needsPickupPoint, pickupType, isScriptReady]);

  const loadFallbackPoints = useCallback(async () => {
    if (!pickupType) return;
    setFallbackLoading(true);
    try {
      const response = await fetch(`/api/shipping/gls/pickup-points?type=${pickupType}&limit=20`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("GLS pontok betöltése sikertelen");
      const data = (await response.json()) as { points?: GlsPickupPoint[] };
      setFallbackPoints(data.points ?? []);
    } catch {
      setFallbackPoints([]);
    } finally {
      setFallbackLoading(false);
    }
  }, [pickupType]);

  useEffect(() => {
    if (!needsPickupPoint || !mapLoadError) return;
    void loadFallbackPoints();
  }, [needsPickupPoint, mapLoadError, loadFallbackPoints]);

  return (
    <div className="space-y-5">
      <Script
        src="https://map.gls-hungary.com/widget/gls-dpm.js"
        type="module"
        strategy="afterInteractive"
        onLoad={() => {
          setIsScriptReady(true);
          setMapLoadError(null);
        }}
        onError={() => {
          setMapLoadError("A hivatalos GLS térkép jelenleg nem érhető el. Próbáld újra.");
        }}
      />

      <div className="space-y-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const price = getShippingCost(subtotal, option.id);
          const isSelected = selectedMethod === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                "w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200",
                "hover:shadow-md",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-100 bg-white hover:border-gray-200"
              )}
            >
              <div className={cn("flex size-12 flex-shrink-0 items-center justify-center rounded-xl", option.bgColor)}>
                <Icon className={cn("size-6", option.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-12 items-center justify-center rounded-md border border-gray-100 bg-white px-1">
                    <img
                      src={SHIPPING_METHOD_LOGOS[option.id]}
                      alt={`${option.name} logó`}
                      className="max-h-4 w-auto object-contain"
                      loading="lazy"
                    />
                  </span>
                  <p className="font-bold text-sm text-neutral-dark tracking-tight">{option.name}</p>
                </div>
                <p className="text-xs text-neutral-medium mt-0.5">{option.description}</p>
                <p className="text-xs font-medium text-neutral-dark/60 mt-0.5">{option.estimatedDays}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {hasFreeShipping ? (
                  <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-lg">
                    Ingyenes
                  </span>
                ) : (
                  <span className="text-sm font-extrabold text-neutral-dark">
                    {formatPrice(price)}
                  </span>
                )}
                <div
                  className={cn(
                    "size-6 flex-shrink-0 rounded-lg border-2 flex items-center justify-center transition-all",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-gray-200 bg-white"
                  )}
                >
                  {isSelected && <Check className="size-3.5 text-white" strokeWidth={3} />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {needsPickupPoint && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            <p className="text-sm font-bold text-neutral-dark">
              Válassz pontos GLS {selectedMethod === "gls-csomagautomata" ? "csomagautomatát" : "csomagpontot"}
            </p>
          </div>

          <p className="text-xs text-neutral-medium">
            A kiválasztás a hivatalos GLS térképen történik.
          </p>

          <button
            type="button"
            onClick={() => setIsMapOpen(true)}
            className="w-full rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            GLS térkép megnyitása (teljes képernyő)
          </button>

          {mapLoadError && (
            <div className="space-y-2">
              <p className="text-xs text-red-500">{mapLoadError}</p>
              <button
                type="button"
                onClick={() => {
                  setMapLoadError(null);
                  setIsMapOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-dark hover:bg-gray-50"
              >
                <RefreshCw className="size-3.5" />
                GLS térkép újrapróbálása
              </button>
            </div>
          )}

          {mapLoadError && (
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs font-semibold text-neutral-dark mb-2">
                Tartalék kiválasztás lista alapon
              </p>
              {fallbackLoading ? (
                <p className="inline-flex items-center gap-1.5 text-xs text-neutral-medium">
                  <Loader2 className="size-3.5 animate-spin" />
                  GLS pontok betöltése...
                </p>
              ) : fallbackPoints.length === 0 ? (
                <p className="text-xs text-neutral-medium">Jelenleg nem érhető el fallback GLS pontlista.</p>
              ) : (
                <div className="max-h-52 space-y-1.5 overflow-y-auto">
                  {fallbackPoints.map((point) => (
                    <button
                      key={point.id}
                      type="button"
                      onClick={() => onSelectPickupPoint(point)}
                      className={cn(
                        "w-full rounded-lg border px-2.5 py-2 text-left text-xs transition-colors",
                        selectedPickupPoint?.id === point.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-primary/40"
                      )}
                    >
                      <p className="font-semibold text-neutral-dark">{point.name}</p>
                      <p className="text-neutral-medium">
                        {point.postalCode} {point.city}, {point.address}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedPickupPoint && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-primary mb-1">
                Kiválasztott pont
              </p>
              <p className="text-sm font-semibold text-neutral-dark">{selectedPickupPoint.name}</p>
              <p className="text-xs text-neutral-medium mt-0.5">
                {selectedPickupPoint.postalCode} {selectedPickupPoint.city}, {selectedPickupPoint.address}
              </p>
            </div>
          )}
        </div>
      )}

      {isMapOpen && needsPickupPoint && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm">
          <div className="h-full w-full bg-white flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <p className="text-xs text-neutral-medium">Hivatalos GLS térkép</p>
                <h3 className="text-sm font-bold text-neutral-dark">
                  {selectedMethod === "gls-csomagautomata" ? "GLS Csomagautomata választás" : "GLS Csomagpont választás"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMapOpen(false)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-neutral-dark hover:bg-gray-50 transition-colors"
              >
                <X className="size-4" />
                Bezárás
              </button>
            </div>
            {!isScriptReady ? (
              <div className="flex-1 grid place-items-center p-6 text-center">
                <p className="text-sm text-neutral-medium">GLS térkép betöltése...</p>
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <div ref={mapHostRef} className="h-full w-full" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-neutral-dark hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Vissza
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedMethod || (needsPickupPoint && !selectedPickupPoint)}
          className="flex items-center justify-center gap-2 flex-1 sm:flex-initial px-8 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Tovább a fizetéshez
          <ArrowRight className="size-4" />
        </button>
      </div>
      {needsPickupPoint && !selectedPickupPoint && (
        <p className="pt-1 text-xs font-medium text-amber-700">
          A továbblépéshez válassz egy pontos GLS átvételi pontot a térképen.
        </p>
      )}
    </div>
  );
}
