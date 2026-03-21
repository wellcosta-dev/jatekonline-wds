"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, PackageCheck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Függőben",
  CONFIRMED: "Megerősítve",
  PROCESSING: "Feldolgozás",
  SHIPPED: "Szállítás alatt",
  DELIVERED: "Kézbesítve",
  CANCELLED: "Törölve",
  REFUNDED: "Visszatérítve",
};

export default function AdminRendelesReszletekPage() {
  const params = useParams<{ id: string }>();
  const orderId = String(params.id ?? "");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [glsLabelLoading, setGlsLabelLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        const payload = (await response.json()) as Order | { error?: string };
        if (!response.ok) {
          throw new Error((payload as { error?: string }).error ?? "Nem sikerült betölteni a rendelést.");
        }
        setOrder(payload as Order);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Betöltési hiba.");
      } finally {
        setLoading(false);
      }
    }
    if (orderId) load();
  }, [orderId]);

  const vatAmount = useMemo(() => {
    if (!order) return 0;
    return Math.max(0, order.total - Math.round(order.total / 1.27));
  }, [order]);

  async function updateStatus(status: OrderStatus) {
    if (!order) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as Order | { error?: string };
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error ?? "Státusz mentési hiba.");
      }
      setOrder(payload as Order);
      setNotice("Állapot frissítve.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Mentési hiba.");
    } finally {
      setSaving(false);
    }
  }

  async function resendEmail(type: "confirmation" | "status_update") {
    if (!order) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Email küldési hiba.");
      }
      setNotice("Email elküldve.");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Email küldési hiba.");
    } finally {
      setSaving(false);
    }
  }

  function isGlsMethod(method: string): boolean {
    return method === "gls" || method === "gls-csomagautomata" || method === "gls-csomagpont";
  }

  async function handleGenerateGlsLabel() {
    if (!order) return;
    setGlsLabelLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/gls-label`, {
        method: "POST",
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        error?: string;
        details?: unknown;
        trackingId?: string;
        labelUrl?: string;
        labelBase64?: string;
        labelContentType?: string;
        order?: Order;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "GLS matrica generálási hiba.");
      }

      if (payload.order) {
        setOrder(payload.order);
      }

      if (payload.labelUrl && typeof window !== "undefined") {
        window.open(payload.labelUrl, "_blank", "noopener,noreferrer");
      } else if (payload.labelBase64 && typeof window !== "undefined") {
        const mimeType = payload.labelContentType || "application/pdf";
        const binary = atob(payload.labelBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = `${order.orderNumber}-gls-matrica.pdf`;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      }

      setNotice(
        payload.trackingId
          ? `GLS matrica elkészült. Tracking: ${payload.trackingId}`
          : "GLS matrica elkészült."
      );
    } catch (labelError) {
      setError(labelError instanceof Error ? labelError.message : "GLS matrica generálási hiba.");
    } finally {
      setGlsLabelLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white px-4 py-6 text-sm text-neutral-medium flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        Rendelés betöltése...
      </div>
    );
  }

  if (!order) {
    return <div className="text-sm text-red-600">A rendelés nem található.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-dark tracking-tight">
            Rendelés: {order.orderNumber}
          </h1>
          <p className="text-sm text-neutral-medium">
            {new Date(order.createdAt).toLocaleString("hu-HU")}
          </p>
        </div>
        <Link
          href="/admin/rendelesek"
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-neutral-dark hover:bg-gray-50"
        >
          Vissza a listához
        </Link>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InfoCard title="Vevő">
          <p className="font-semibold">{order.shippingAddress.name}</p>
          <p>{order.guestEmail || order.shippingAddress.email || "-"}</p>
          <p>{order.shippingAddress.phone || "-"}</p>
        </InfoCard>

        <InfoCard title="Fizetési mód">
          <p>{order.paymentMethod}</p>
        </InfoCard>

        <InfoCard title="Szállítási mód">
          <p>{order.shippingMethod}</p>
          {order.shippingPickupPoint ? (
            <p className="text-xs text-neutral-medium mt-1">
              {order.shippingPickupPoint.name}, {order.shippingPickupPoint.postalCode}{" "}
              {order.shippingPickupPoint.city}
            </p>
          ) : null}
        </InfoCard>

        <InfoCard title="Szállítólevél-azonosító">
          <p>{order.glsTrackingId || order.postaTrackingId || "-"}</p>
        </InfoCard>

        <InfoCard title="Szállítási cím">
          <p className="font-semibold">{order.shippingAddress.name}</p>
          <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
          <p>{order.shippingAddress.street}</p>
          <p>{order.shippingAddress.country}</p>
        </InfoCard>

        <InfoCard title="Számlázási cím">
          <p className="font-semibold">{order.billingAddress.name}</p>
          <p>{order.billingAddress.postalCode} {order.billingAddress.city}</p>
          <p>{order.billingAddress.street}</p>
          <p>{order.billingAddress.country}</p>
        </InfoCard>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="text-base font-extrabold text-neutral-dark mb-3">Termékek</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
              <div>
                <p className="font-semibold text-sm text-neutral-dark">
                  {item.productName} ({item.productId})
                </p>
                <p className="text-xs text-neutral-medium">{item.quantity} db</p>
              </div>
              <p className="text-sm font-bold text-neutral-dark">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4 text-sm space-y-1.5">
          <div className="flex justify-between">
            <span>Nettó részösszeg:</span>
            <span>{formatPrice(Math.round(order.total / 1.27))}</span>
          </div>
          <div className="flex justify-between">
            <span>ÁFA (27%):</span>
            <span>{formatPrice(vatAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Bruttó részösszeg:</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>{order.shippingMethod}:</span>
            <span>{formatPrice(order.shippingPrice)}</span>
          </div>
          <div className="flex justify-between font-extrabold text-base pt-2 border-t border-gray-100">
            <span>Összesen bruttó:</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
        <h2 className="text-base font-extrabold text-neutral-dark">Történet</h2>
        <p className="text-sm text-neutral-medium">
          {new Date(order.updatedAt).toLocaleString("hu-HU")} - A rendelés aktuális állapota:{" "}
          {statusLabels[order.status]}
        </p>
        <p className="text-sm text-neutral-medium">
          {new Date(order.createdAt).toLocaleString("hu-HU")} - {order.shippingAddress.name} leadta a rendelést.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={order.status}
          onChange={(event) => updateStatus(event.target.value as OrderStatus)}
          disabled={saving}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {(Object.keys(statusLabels) as OrderStatus[]).map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>

        <button
          onClick={() => resendEmail("confirmation")}
          disabled={saving}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-neutral-dark hover:bg-gray-50 disabled:opacity-60"
        >
          Visszaigazoló újraküldése
        </button>
        <button
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-neutral-dark hover:bg-gray-50"
          disabled
        >
          Számla készítése (később)
        </button>
        <button
          onClick={handleGenerateGlsLabel}
          disabled={glsLabelLoading || saving || !isGlsMethod(order.shippingMethod)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-neutral-dark hover:bg-gray-50 disabled:opacity-60"
          title={
            isGlsMethod(order.shippingMethod)
              ? "GLS címke generálása"
              : "Csak GLS szállítási módnál érhető el"
          }
        >
          {glsLabelLoading ? <Loader2 className="size-4 animate-spin" /> : <PackageCheck className="size-4" />}
          GLS matrica generálása
        </button>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-medium mb-2">{title}</h3>
      <div className="text-sm text-neutral-dark space-y-0.5">{children}</div>
    </div>
  );
}
