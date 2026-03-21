"use client";

import { useEffect, useMemo, useState } from "react";

type Settings = {
  enabled: boolean;
  inactivityMinutes: number;
  reminderDelayMinutes: number;
  maxReminders: number;
};

type CartRecord = {
  id: string;
  userEmail?: string;
  status: "ACTIVE" | "ABANDONED" | "RECOVERED" | "CLEARED";
  totalItems: number;
  subtotal: number;
  reminderCount: number;
  lastActivityAt: string;
  recoveredOrderNumber?: string;
};

export default function AdminAbandonedCartsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [carts, setCarts] = useState<CartRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const abandonedCount = useMemo(
    () => carts.filter((cart) => cart.status === "ABANDONED").length,
    [carts]
  );

  const load = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const [settingsResponse, cartsResponse] = await Promise.all([
        fetch("/api/admin/abandoned-cart-settings", { cache: "no-store" }),
        fetch("/api/admin/abandoned-carts", { cache: "no-store" }),
      ]);
      const settingsPayload = (await settingsResponse.json()) as { settings?: Settings; error?: string };
      const cartsPayload = (await cartsResponse.json()) as { carts?: CartRecord[]; error?: string };
      if (!settingsResponse.ok) throw new Error(settingsPayload.error ?? "Beállítások betöltése sikertelen.");
      if (!cartsResponse.ok) throw new Error(cartsPayload.error ?? "Kosarak betöltése sikertelen.");
      setSettings(settingsPayload.settings ?? null);
      setCarts(cartsPayload.carts ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Ismeretlen hiba.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    const response = await fetch("/api/admin/abandoned-cart-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setNotice(payload.error ?? "Mentési hiba.");
      return;
    }
    setNotice("Beállítások mentve.");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-neutral-dark tracking-tight">Elhagyott kosarak</h1>
        <p className="text-sm text-neutral-medium">Jelenleg {abandonedCount} elhagyott kosár.</p>
      </div>

      {notice && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-neutral-medium">
          {notice}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        {loading || !settings ? (
          <p className="text-sm text-neutral-medium">Beállítások betöltése...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-xs font-semibold text-neutral-medium">
              Aktív
              <select
                className="mt-1 input-field"
                value={settings.enabled ? "true" : "false"}
                onChange={(event) =>
                  setSettings((prev) => (prev ? { ...prev, enabled: event.target.value === "true" } : prev))
                }
              >
                <option value="true">Igen</option>
                <option value="false">Nem</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-neutral-medium">
              Inaktivitási idő (perc)
              <input
                className="mt-1 input-field"
                type="number"
                min={5}
                value={settings.inactivityMinutes}
                onChange={(event) =>
                  setSettings((prev) => (prev ? { ...prev, inactivityMinutes: Number(event.target.value) } : prev))
                }
              />
            </label>
            <label className="text-xs font-semibold text-neutral-medium">
              Emlékeztető késleltetés (perc)
              <input
                className="mt-1 input-field"
                type="number"
                min={5}
                value={settings.reminderDelayMinutes}
                onChange={(event) =>
                  setSettings((prev) =>
                    prev ? { ...prev, reminderDelayMinutes: Number(event.target.value) } : prev
                  )
                }
              />
            </label>
            <label className="text-xs font-semibold text-neutral-medium">
              Max emlékeztető
              <input
                className="mt-1 input-field"
                type="number"
                min={0}
                value={settings.maxReminders}
                onChange={(event) =>
                  setSettings((prev) => (prev ? { ...prev, maxReminders: Number(event.target.value) } : prev))
                }
              />
            </label>
            <div className="md:col-span-4">
              <button type="button" onClick={saveSettings} className="btn-primary">
                Beállítások mentése
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <p className="p-4 text-sm text-neutral-medium">Kosarak betöltése...</p>
        ) : carts.length === 0 ? (
          <p className="p-4 text-sm text-neutral-medium">Nincs elhagyott kosár adat.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {carts.map((cart) => (
              <div key={cart.id} className="p-4 flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-neutral-dark">{cart.userEmail || "Vendég session"}</span>
                <span className="text-xs text-neutral-medium">{cart.totalItems} termék</span>
                <span className="text-xs text-neutral-medium">{cart.subtotal.toLocaleString("hu-HU")} Ft</span>
                <span className="text-xs text-neutral-medium">
                  Utolsó aktivitás: {new Date(cart.lastActivityAt).toLocaleString("hu-HU")}
                </span>
                <span className="text-xs font-semibold text-primary">Emlékeztetők: {cart.reminderCount}</span>
                <span className="text-xs font-semibold">{cart.status}</span>
                {cart.recoveredOrderNumber && (
                  <span className="text-xs text-emerald-700">Recovered: {cart.recoveredOrderNumber}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
