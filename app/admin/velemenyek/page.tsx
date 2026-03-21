"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";

type AdminReview = {
  id: string;
  productId: string;
  userEmail: string;
  authorName: string;
  rating: number;
  content: string;
  status: "PENDING" | "APPROVED";
  createdAt: string;
};

export default function AdminReviewsPage() {
  const [items, setItems] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "PENDING").length,
    [items]
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/reviews", { cache: "no-store" });
      const payload = (await response.json()) as { reviews?: AdminReview[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Nem sikerült betölteni a véleményeket.");
      }
      setItems(payload.reviews ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    setWorkingId(id);
    try {
      const response = await fetch(`/api/admin/reviews/${id}/approve`, { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Nem sikerült jóváhagyni.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba.");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-dark tracking-tight">Vélemények</h1>
          <p className="text-sm text-neutral-medium">
            Függőben: <span className="font-bold text-primary">{pendingCount}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-neutral-medium inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Betöltés...
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-neutral-medium">Nincs még beküldött vélemény.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-neutral-dark">
                    {item.productId}
                  </span>
                  <span className="text-neutral-medium">{item.userEmail}</span>
                  <span className="text-amber-600 font-bold">{item.rating}/5</span>
                  <span
                    className={`rounded-full px-2 py-1 font-bold ${
                      item.status === "PENDING"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {item.status === "PENDING" ? "Függőben" : "Jóváhagyva"}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-neutral-dark">{item.authorName}</p>
                <p className="mt-1 text-sm text-neutral-dark leading-relaxed">{item.content}</p>
                <div className="mt-3">
                  {item.status === "PENDING" && (
                    <button
                      type="button"
                      onClick={() => approve(item.id)}
                      disabled={workingId === item.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-light disabled:opacity-60"
                    >
                      {workingId === item.id ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" /> Feldolgozás...
                        </>
                      ) : (
                        <>
                          <Check className="size-3.5" /> Jóváhagyás
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
