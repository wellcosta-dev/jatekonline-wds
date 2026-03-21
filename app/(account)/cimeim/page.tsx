"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Address } from "@/types";

export default function CimeimPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/account/profile", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!active || !response.ok) return;
        const user = payload.user as { addresses?: Address[] } | undefined;
        setAddresses(user?.addresses ?? []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const saveAddresses = async (next: Address[]) => {
    const previous = addresses;
    setAddresses(next);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "addresses", addresses: next }),
      });
      if (!response.ok) {
        setAddresses(previous);
        setNotice("Nem sikerült menteni a címeket.");
        return;
      }
      setNotice("Címek mentve.");
    } catch {
      setAddresses(previous);
      setNotice("Hálózati hiba miatt nem sikerült menteni a címeket.");
    }
  };

  const addEmptyAddress = () => {
    const next: Address[] = [
      ...addresses,
      {
        name: "",
        email: "",
        phone: "",
        street: "",
        city: "",
        postalCode: "",
        country: "Magyarország",
      },
    ];
    setAddresses(next);
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-dark mb-6">
        Címeim
      </h1>
      {loading ? (
        <div className="card p-8 text-sm text-neutral-medium">Címek betöltése...</div>
      ) : addresses.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-pale flex items-center justify-center mx-auto mb-6">
            <MapPin className="size-10 text-primary" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-neutral-dark mb-2">
            Nincs mentett cím
          </h2>
          <p className="text-neutral-medium mb-6 max-w-md mx-auto">
            Adj hozzá címet, hogy a következő rendelésed gyorsabb legyen.
          </p>
          <div className="flex justify-center gap-2">
            <button type="button" onClick={addEmptyAddress} className="btn-primary inline-flex items-center gap-2">
              <Plus className="size-4" /> Új cím
            </button>
            <Link href="/" className="btn-outline">Vásárlás indítása</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address, index) => (
            <div key={index} className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="input-field"
                placeholder="Név"
                value={address.name}
                onChange={(event) => {
                  const next = [...addresses];
                  next[index] = { ...next[index], name: event.target.value };
                  setAddresses(next);
                }}
              />
              <input
                className="input-field"
                placeholder="Telefon"
                value={address.phone ?? ""}
                onChange={(event) => {
                  const next = [...addresses];
                  next[index] = { ...next[index], phone: event.target.value };
                  setAddresses(next);
                }}
              />
              <input
                className="input-field md:col-span-2"
                placeholder="Utca, házszám"
                value={address.street}
                onChange={(event) => {
                  const next = [...addresses];
                  next[index] = { ...next[index], street: event.target.value };
                  setAddresses(next);
                }}
              />
              <input
                className="input-field"
                placeholder="Város"
                value={address.city}
                onChange={(event) => {
                  const next = [...addresses];
                  next[index] = { ...next[index], city: event.target.value };
                  setAddresses(next);
                }}
              />
              <input
                className="input-field"
                placeholder="Irányítószám"
                value={address.postalCode}
                onChange={(event) => {
                  const next = [...addresses];
                  next[index] = { ...next[index], postalCode: event.target.value };
                  setAddresses(next);
                }}
              />
              <div className="md:col-span-2 flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => saveAddresses(addresses.filter((_, itemIndex) => itemIndex !== index))}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="size-4" /> Törlés
                </button>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addEmptyAddress} className="btn-outline inline-flex items-center gap-2">
              <Plus className="size-4" /> Új cím
            </button>
            <button type="button" onClick={() => saveAddresses(addresses)} className="btn-primary">
              Címek mentése
            </button>
          </div>
          {notice && <p className="text-sm text-neutral-medium">{notice}</p>}
        </div>
      )}
    </div>
  );
}
