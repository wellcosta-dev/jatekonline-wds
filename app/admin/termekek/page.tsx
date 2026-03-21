"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, ImageIcon, Loader2, RefreshCw, Search, XCircle } from "lucide-react";
import type { Category, Product } from "@/types";
import { formatPrice } from "@/lib/utils";

type ProductPayload = {
  products?: Product[];
  categories?: Category[];
  error?: string;
};

type SupplierSyncStatus = {
  running: boolean;
  lastStartedAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
  lastSummary?: {
    attemptedCount: number;
    successCount: number;
    updatedCount: number;
    failedCount: number;
    startedAt: string;
    finishedAt: string;
    mode: "test" | "full" | "single";
    results?: Array<{
      productId: string;
      productName: string;
      ok: boolean;
      updated: boolean;
      reason?: string;
    }>;
  };
};

export default function AdminTermekekPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [syncStatus, setSyncStatus] = useState<SupplierSyncStatus | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncNotice, setSyncNotice] = useState("");
  const [syncTargetProductId, setSyncTargetProductId] = useState<string | null>(null);

  async function loadProductsData() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/products", { cache: "no-store" });
      const payload = (await response.json()) as ProductPayload;
      if (!response.ok) throw new Error(payload.error ?? "Nem sikerült betölteni a termékeket.");
      setProducts(payload.products ?? []);
      setCategories(payload.categories ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Betöltési hiba történt.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSyncStatus() {
    try {
      const response = await fetch("/api/admin/supplier-sync", { cache: "no-store" });
      const payload = (await response.json()) as { status?: SupplierSyncStatus };
      if (!response.ok) throw new Error("Nem sikerült lekérni a beszállítói szinkron állapotát.");
      setSyncStatus(payload.status ?? null);
    } catch (statusError) {
      setSyncNotice(
        statusError instanceof Error ? statusError.message : "Szinkron státusz lekérés sikertelen."
      );
    }
  }

  useEffect(() => {
    void Promise.all([loadProductsData(), loadSyncStatus()]);
  }, []);

  useEffect(() => {
    if (!syncStatus?.running) return;
    const intervalId = window.setInterval(() => {
      void loadSyncStatus();
    }, 1500);
    return () => window.clearInterval(intervalId);
  }, [syncStatus?.running]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const q = search.trim().toLowerCase();
      const searchMatch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        product.slug.toLowerCase().includes(q);
      const statusMatch =
        !statusFilter ||
        (statusFilter === "active" && product.isActive) ||
        (statusFilter === "inactive" && !product.isActive);
      const categoryMatch = !categoryFilter || product.categoryId === categoryFilter;
      return searchMatch && statusMatch && categoryMatch;
    });
  }, [products, search, statusFilter, categoryFilter]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((item) => selectedIds.has(item.id));

  function categoryName(id: string): string {
    return categories.find((entry) => entry.id === id)?.name ?? "-";
  }

  function setSavingFlag(id: string, value: boolean) {
    setSaving((prev) => ({ ...prev, [id]: value }));
  }

  function quality(product: Product): { label: string; tone: string; issues: string[] } {
    const issues: string[] = [];
    if (!product.manufacturer?.trim()) issues.push("hiányzó márka");
    if (!product.ean?.trim()) issues.push("hiányzó GTIN/EAN");
    if (!product.manufacturerSku?.trim()) issues.push("hiányzó MPN");
    if (!product.images?.[0]) issues.push("nincs fő kép");
    if (!product.shortDesc?.trim() && !product.description?.trim()) issues.push("gyenge leírás");
    if (product.salePrice !== undefined && product.salePrice >= product.price) issues.push("hibás akciós ár");
    if (issues.length === 0) return { label: "Kiváló", tone: "text-emerald-700 bg-emerald-50 border-emerald-200", issues };
    if (issues.length <= 2) return { label: "Jó", tone: "text-amber-700 bg-amber-50 border-amber-200", issues };
    return { label: "Javítandó", tone: "text-red-700 bg-red-50 border-red-200", issues };
  }

  async function patchProduct(
    productId: string,
    patch: Partial<Pick<Product, "price" | "stock" | "isActive">>
  ) {
    setSavingFlag(productId, true);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json()) as { product?: Product; error?: string };
      if (!response.ok || !payload.product) {
        throw new Error(payload.error ?? "Mentési hiba.");
      }
      setProducts((prev) =>
        prev.map((entry) => (entry.id === payload.product!.id ? payload.product! : entry))
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Mentési hiba.");
    } finally {
      setSavingFlag(productId, false);
    }
  }

  async function runSupplierSync(mode: "test" | "full" | "single", productId?: string) {
    setSyncBusy(true);
    setSyncNotice("");
    setSyncTargetProductId(productId ?? null);
    setSyncStatus((prev) => ({
      ...(prev ?? { running: true }),
      running: true,
      lastStartedAt: new Date().toISOString(),
      lastSummary:
        prev?.lastSummary && mode !== "single"
          ? { ...prev.lastSummary, mode, attemptedCount: prev.lastSummary.attemptedCount }
          : prev?.lastSummary,
    }));
    try {
      const response = await fetch("/api/admin/supplier-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          ...(mode === "test" ? { limit: 3 } : {}),
          ...(productId ? { productId } : {}),
        }),
      });
      const payload = (await response.json()) as { error?: string; summary?: SupplierSyncStatus["lastSummary"] };
      if (!response.ok) throw new Error(payload.error ?? "A beszállítói szinkron futtatása sikertelen.");
      const modeLabel = mode === "test" ? "Teszt" : mode === "single" ? "Egyedi" : "Teljes";
      setSyncNotice(
        `${modeLabel} szinkron kész: ${payload.summary?.successCount ?? 0}/${payload.summary?.attemptedCount ?? 0} sikeres.`
      );
      await Promise.all([loadProductsData(), loadSyncStatus()]);
    } catch (syncError) {
      setSyncNotice(syncError instanceof Error ? syncError.message : "Szinkron futtatási hiba.");
    } finally {
      setSyncBusy(false);
      setSyncTargetProductId(null);
    }
  }

  function getMargin(product: Product): { marginPercent: number; profitFt: number } | null {
    const salePrice = Number(product.salePrice ?? product.price);
    const purchasePrice = Number(product.purchasePrice);
    if (!Number.isFinite(salePrice) || salePrice <= 0 || !Number.isFinite(purchasePrice) || purchasePrice <= 0) {
      return null;
    }
    const profitFt = Math.round(salePrice - purchasePrice);
    const marginPercent = ((salePrice - purchasePrice) / salePrice) * 100;
    return { marginPercent, profitFt };
  }

  const lastSummary = syncStatus?.lastSummary;
  const successRate =
    lastSummary && lastSummary.attemptedCount > 0
      ? Math.round((lastSummary.successCount / lastSummary.attemptedCount) * 100)
      : 0;
  const isSingleSyncRunning = syncStatus?.running && syncTargetProductId;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-dark tracking-tight">Termékkezelés</h1>
          <p className="text-sm text-neutral-medium">{filtered.length} termék</p>
        </div>
      </div>

      <div className="rounded-2xl border border-violet-200 bg-violet-50/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div>
            <p className="text-sm font-bold text-neutral-dark">Beszállítói készlet + beszerzési ár szinkron</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  syncStatus?.running
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                {syncStatus?.running ? "Frissítés folyamatban..." : "Készenlét"}
              </span>
              {syncStatus?.running ? <Loader2 className="size-3.5 animate-spin text-amber-700" /> : null}
            </div>
            <p className="text-xs text-neutral-medium">
              Utolsó sikeres futás:{" "}
              {syncStatus?.lastSuccessAt
                ? new Date(syncStatus.lastSuccessAt).toLocaleString("hu-HU")
                : "még nem futott"}
            </p>
            {syncStatus?.lastSummary ? (
              <p className="text-xs text-neutral-medium">
                Legutóbbi: {syncStatus.lastSummary.successCount}/{syncStatus.lastSummary.attemptedCount} sikeres,
                frissített: {syncStatus.lastSummary.updatedCount}, hiba: {syncStatus.lastSummary.failedCount}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => runSupplierSync("test")}
              disabled={syncBusy || syncStatus?.running}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-white px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-60"
            >
              <RefreshCw className={`size-3.5 ${syncBusy ? "animate-spin" : ""}`} />
              Teszt futtatás (3 termék)
            </button>
            <button
              type="button"
              onClick={() => runSupplierSync("full")}
              disabled={syncBusy || syncStatus?.running}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              <RefreshCw className={`size-3.5 ${syncBusy ? "animate-spin" : ""}`} />
              Teljes szinkron
            </button>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-2 w-full rounded-full bg-violet-100 overflow-hidden">
            {syncStatus?.running ? (
              <div className="h-full w-1/3 animate-pulse bg-gradient-to-r from-violet-400 to-violet-600" />
            ) : (
              <div
                className={`h-full transition-all duration-500 ${
                  successRate >= 100 ? "bg-emerald-500" : successRate > 0 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.max(6, successRate)}%` }}
              />
            )}
          </div>
          {!syncStatus?.running && lastSummary ? (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="size-3.5" />
                Sikeres: {lastSummary.successCount}
              </span>
              <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
                <XCircle className="size-3.5" />
                Hibás: {lastSummary.failedCount}
              </span>
              <span className="text-neutral-medium">
                Sikerarány: {successRate}% · Mód:{" "}
                {lastSummary.mode === "test"
                  ? "Teszt"
                  : lastSummary.mode === "single"
                    ? "Egyedi"
                    : "Teljes"}
              </span>
            </div>
          ) : null}
        </div>
        {syncNotice ? (
          <p className="mt-2 text-xs font-semibold text-neutral-dark">{syncNotice}</p>
        ) : null}
        {syncStatus?.lastError ? (
          <p className="mt-1 text-xs text-red-700">Legutóbbi hiba: {syncStatus.lastError}</p>
        ) : null}
        {!syncStatus?.running && lastSummary?.results && lastSummary.results.length > 0 ? (
          <div className="mt-2 rounded-xl border border-violet-200 bg-white/70 px-3 py-2">
            <p className="text-[11px] font-bold text-neutral-dark mb-1">Legutóbbi futás minták</p>
            <div className="space-y-1">
              {lastSummary.results.slice(0, 3).map((result) => (
                <p key={result.productId} className="text-[11px] text-neutral-medium">
                  <span className={result.ok ? "text-emerald-700 font-semibold" : "text-red-700 font-semibold"}>
                    {result.ok ? "OK" : "HIBA"}
                  </span>{" "}
                  · {result.productName} {result.reason ? `- ${result.reason}` : ""}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-medium" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Keresés név, slug, cikkszám..."
            className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Összes állapot</option>
          <option value="active">Aktív</option>
          <option value="inactive">Inaktív</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Összes kategória</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-6 text-sm text-neutral-medium flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Betöltés...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={() =>
                      setSelectedIds(
                        allVisibleSelected ? new Set() : new Set(filtered.map((item) => item.id))
                      )
                    }
                    className="size-4"
                  />
                </th>
                <th className="text-left px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Kép
                </th>
                <th className="text-left px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Termék neve
                </th>
                <th className="text-left px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Cikkszám
                </th>
                <th className="text-left px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Bruttó alapár
                </th>
                <th className="text-left px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Készlet
                </th>
                <th className="text-left px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Haszonkulcs
                </th>
                <th className="text-left px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Állapot
                </th>
                <th className="text-left px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Kategória
                </th>
                <th className="text-left px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Adatminőség
                </th>
                <th className="text-right px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Megtekintés
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/60">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() =>
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(product.id)) next.delete(product.id);
                          else next.add(product.id);
                          return next;
                        })
                      }
                      className="size-4"
                    />
                  </td>
                  <td className="px-3 py-3">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="size-10 rounded-lg border border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="size-10 rounded-lg border border-gray-200 bg-gray-50 grid place-items-center">
                        <ImageIcon className="size-4 text-neutral-medium" />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/termekek/${product.id}`}
                      className="text-sm font-semibold text-neutral-dark hover:text-primary"
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-xs text-neutral-medium font-mono">{product.sku}</td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min={0}
                      defaultValue={product.price}
                      onBlur={(event) => {
                        const value = Number(event.target.value);
                        if (!Number.isFinite(value) || value === product.price) return;
                        patchProduct(product.id, { price: value });
                      }}
                      className="w-28 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                    />
                    <div className="mt-1 text-[11px] text-neutral-medium">
                      {formatPrice(product.salePrice ?? product.price)}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={product.stock}
                      onBlur={(event) => {
                        const value = Math.max(0, Math.floor(Number(event.target.value)));
                        if (!Number.isFinite(value) || value === product.stock) return;
                        patchProduct(product.id, { stock: value });
                      }}
                      className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-3 py-3">
                    {(() => {
                      const margin = getMargin(product);
                      if (!margin) return <span className="text-xs text-neutral-medium">n/a</span>;
                      const isLow = margin.marginPercent < 8;
                      return (
                        <div className="text-xs">
                          <span className={`font-extrabold ${isLow ? "text-red-700" : "text-emerald-700"}`}>
                            {margin.marginPercent.toFixed(1)}%
                          </span>
                          <span className="text-neutral-medium"> · Haszon: </span>
                          <span className={`font-bold ${isLow ? "text-red-700" : "text-neutral-dark"}`}>
                            {formatPrice(margin.profitFt)}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={product.isActive ? "active" : "inactive"}
                      onChange={(event) =>
                        patchProduct(product.id, { isActive: event.target.value === "active" })
                      }
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                    >
                      <option value="active">Aktív</option>
                      <option value="inactive">Inaktív</option>
                    </select>
                    {saving[product.id] ? (
                      <div className="mt-1 text-[11px] text-neutral-medium">Mentés...</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-sm text-neutral-medium">
                    {categoryName(product.categoryId)}
                  </td>
                  <td className="px-3 py-3">
                    {(() => {
                      const q = quality(product);
                      return (
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${q.tone}`}
                          title={q.issues.length ? q.issues.join(", ") : "Minden fontos attribútum rendben."}
                        >
                          {q.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => runSupplierSync("single", product.id)}
                        disabled={syncBusy || syncStatus?.running}
                        className="inline-flex items-center justify-center rounded-lg border border-violet-200 p-2 text-violet-700 hover:bg-violet-50 disabled:opacity-60"
                        title="Beszállítói frissítés ehhez a termékhez"
                      >
                        <RefreshCw
                          className={`size-4 ${
                            isSingleSyncRunning === product.id ? "animate-spin text-amber-700" : ""
                          }`}
                        />
                      </button>
                      <Link
                        href={`/termekek/${product.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-neutral-dark hover:bg-gray-50"
                        title="Termékoldal megtekintése"
                      >
                        <Eye className="size-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-sm text-neutral-medium">
                    Nincs találat a megadott feltételekre.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
