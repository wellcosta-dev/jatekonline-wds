"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Plus,
  Save,
  RefreshCw,
  Trash2,
  Underline,
} from "lucide-react";
import type { Category, Product } from "@/types";
import { SHIPPING_METHOD_LABELS, type ShippingMethod } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";
import { BUSINESS_VAT_CODE, toNetPrice, toVatAmount } from "@/lib/tax";

type ProductResponse = { product?: Product; error?: string };
type ProductListResponse = { categories?: Category[] };

type AttributeRow = { key: string; value: string };
type DocumentRow = { name: string; url: string };
type PromotionRow = { name: string; startAt: string; endAt: string; salePrice: string };

type ProductForm = {
  name: string;
  sku: string;
  manufacturerSku: string;
  ean: string;
  shortDesc: string;
  description: string;
  unitName: string;
  isActive: boolean;
  price: string;
  vatRate: string;
  purchasePrice: string;
  supplierUrl: string;
  stock: string;
  sizeValue: string;
  sizeUnit: string;
  weight: string;
  weightUnit: string;
  images: string[];
  attributeRows: AttributeRow[];
  manufacturer: string;
  categoryIds: string[];
  documents: DocumentRow[];
  promotions: PromotionRow[];
  excludedShippingMethods: string[];
  excludedPaymentMethods: string[];
};

const TABS = [
  { id: "altalanos", label: "Általános" },
  { id: "adatok", label: "Adatok" },
  { id: "tulajdonsagok", label: "Tulajdonságok" },
  { id: "linkek", label: "Linkek" },
  { id: "mukodes", label: "Működés" },
  { id: "akciok", label: "Akciók" },
  { id: "kepek", label: "További képek" },
  { id: "fizetes-szallitas", label: "Fizetés és szállítás" },
] as const;

const PAYMENT_METHODS = [
  { id: "card", label: "Bankkártya" },
  { id: "cod", label: "Utánvét" },
  { id: "transfer", label: "Átutalás" },
];

function toDatetimeLocal(value?: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const tzOffset = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - tzOffset).toISOString().slice(0, 16);
}

function toIso(value: string): string | undefined {
  if (!value.trim()) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function parseDateTimeLocal(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getActivePromotionSalePrice(promotions: PromotionRow[]): number | undefined {
  const now = Date.now();
  const activeSalePrices = promotions
    .map((entry) => {
      const salePrice = Number(entry.salePrice || 0);
      if (!Number.isFinite(salePrice) || salePrice <= 0) return undefined;
      const startAt = parseDateTimeLocal(entry.startAt);
      const endAt = parseDateTimeLocal(entry.endAt);
      if (startAt !== undefined && startAt > now) return undefined;
      if (endAt !== undefined && endAt < now) return undefined;
      return salePrice;
    })
    .filter((entry): entry is number => typeof entry === "number");
  if (activeSalePrices.length === 0) return undefined;
  return Math.min(...activeSalePrices);
}

function attributesToRows(
  attributes?: Record<string, string | string[]>
): AttributeRow[] {
  if (!attributes) return [{ key: "", value: "" }];
  const rows: AttributeRow[] = [];
  Object.entries(attributes).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => rows.push({ key, value: String(entry) }));
      return;
    }
    rows.push({ key, value: String(value) });
  });
  return rows.length > 0 ? rows : [{ key: "", value: "" }];
}

function toForm(product: Product): ProductForm {
  return {
    name: product.name ?? "",
    sku: product.sku ?? "",
    manufacturerSku: product.manufacturerSku ?? "",
    ean: product.ean ?? "",
    shortDesc: product.shortDesc ?? "",
    description: product.description ?? "",
    unitName: product.unitName ?? "db",
    isActive: product.isActive,
    price: String(product.price ?? 0),
    vatRate: product.vatRate ?? BUSINESS_VAT_CODE,
    purchasePrice: product.purchasePrice !== undefined ? String(product.purchasePrice) : "",
    supplierUrl: product.supplierUrl ?? "",
    stock: String(product.stock ?? 0),
    sizeValue: product.sizeValue ?? "",
    sizeUnit: product.sizeUnit ?? "cm",
    weight: product.weight !== undefined ? String(product.weight) : "",
    weightUnit: product.weightUnit ?? "kg",
    images: product.images?.length ? product.images : [""],
    attributeRows: attributesToRows(product.attributes),
    manufacturer: product.manufacturer ?? "",
    categoryIds: product.categoryIds?.length ? product.categoryIds : [product.categoryId],
    documents:
      Array.isArray(product.documents) && product.documents.length > 0
        ? product.documents.map((entry) => ({ name: entry.name, url: entry.url }))
        : [{ name: "", url: "" }],
    promotions:
      Array.isArray(product.promotions) && product.promotions.length > 0
        ? product.promotions.map((entry) => ({
            name: entry.name ?? "",
            startAt: toDatetimeLocal(entry.startAt),
            endAt: toDatetimeLocal(entry.endAt),
            salePrice: entry.salePrice !== undefined ? String(entry.salePrice) : "",
          }))
        : [{ name: "", startAt: "", endAt: "", salePrice: "" }],
    excludedShippingMethods: product.excludedShippingMethods ?? [],
    excludedPaymentMethods: product.excludedPaymentMethods ?? [],
  };
}

function qualityIssuesFromForm(form: ProductForm): string[] {
  const issues: string[] = [];
  const numericPrice = Number(form.price || 0);
  const numericSalePrice = form.promotions
    .map((entry) => Number(entry.salePrice || 0))
    .find((entry) => Number.isFinite(entry) && entry > 0);
  if (!form.name.trim()) issues.push("Hiányzó terméknév");
  if (!form.manufacturer.trim()) issues.push("Hiányzó márka");
  if (!form.ean.trim()) issues.push("Hiányzó GTIN/EAN");
  if (!form.manufacturerSku.trim() && !form.sku.trim()) issues.push("Hiányzó MPN/gyártói cikkszám");
  if (!form.images.some((image) => image.trim().length > 0)) issues.push("Nincs fő termékkép");
  if (!form.shortDesc.trim() && !form.description.trim()) issues.push("Hiányzó termékleírás");
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) issues.push("Érvénytelen ár");
  if (numericSalePrice !== undefined && numericSalePrice >= numericPrice) {
    issues.push("Hibás akciós ár (nem kisebb az alapárnál)");
  }
  return issues;
}

export default function AdminTermekSzerkesztoPage() {
  const params = useParams<{ id: string }>();
  const productId = String(params.id ?? "");
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("altalanos");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [syncingSupplier, setSyncingSupplier] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [productRes, listRes] = await Promise.all([
          fetch(`/api/admin/products/${productId}`, { cache: "no-store" }),
          fetch("/api/admin/products", { cache: "no-store" }),
        ]);
        const productPayload = (await productRes.json()) as ProductResponse;
        const listPayload = (await listRes.json()) as ProductListResponse;
        if (!productRes.ok || !productPayload.product) {
          throw new Error(productPayload.error ?? "Nem sikerült betölteni a terméket.");
        }
        setProduct(productPayload.product);
        setForm(toForm(productPayload.product));
        setCategories(listPayload.categories ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Betöltési hiba.");
      } finally {
        setLoading(false);
      }
    }
    if (productId) load();
  }, [productId]);

  function updateForm(patch: Partial<ProductForm>) {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function toggleArrayValue(current: string[], value: string): string[] {
    if (current.includes(value)) return current.filter((entry) => entry !== value);
    return [...current, value];
  }

  async function handleSave() {
    if (!form || !product) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const attributesMap: Record<string, string | string[]> = {};
      form.attributeRows.forEach((row) => {
        const key = row.key.trim();
        const value = row.value.trim();
        if (!key || !value) return;
        const current = attributesMap[key];
        if (current === undefined) {
          attributesMap[key] = value;
          return;
        }
        if (Array.isArray(current)) {
          attributesMap[key] = [...current, value];
          return;
        }
        attributesMap[key] = [current, value];
      });

      const documents = form.documents
        .map((entry) => ({ name: entry.name.trim(), url: entry.url.trim() }))
        .filter((entry) => entry.name && entry.url);
      const promotions = form.promotions
        .map((entry) => ({
          name: entry.name.trim(),
          startAt: toIso(entry.startAt),
          endAt: toIso(entry.endAt),
          salePrice: entry.salePrice ? Number(entry.salePrice) : undefined,
        }))
        .filter((entry) => entry.name);
      const categoryIds = form.categoryIds.length > 0 ? form.categoryIds : [product.categoryId];

      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          manufacturerSku: form.manufacturerSku,
          ean: form.ean,
          shortDesc: form.shortDesc,
          description: form.description,
          unitName: form.unitName,
          isActive: form.isActive,
          price: Number(form.price || 0),
          vatRate: BUSINESS_VAT_CODE,
          purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
          supplierUrl: form.supplierUrl,
          stock: Math.max(0, Math.floor(Number(form.stock || 0))),
          sizeValue: form.sizeValue,
          sizeUnit: form.sizeUnit,
          weight: form.weight ? Number(form.weight) : undefined,
          weightUnit: form.weightUnit,
          images: form.images.map((entry) => entry.trim()).filter(Boolean),
          attributes: attributesMap,
          manufacturer: form.manufacturer,
          categoryId: categoryIds[0],
          categoryIds,
          documents,
          promotions,
          excludedShippingMethods: form.excludedShippingMethods,
          excludedPaymentMethods: form.excludedPaymentMethods,
        }),
      });

      const payload = (await response.json()) as ProductResponse;
      if (!response.ok || !payload.product) {
        throw new Error(payload.error ?? "Mentési hiba.");
      }
      setProduct(payload.product);
      setForm(toForm(payload.product));
      setNotice("Termék mentve.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Mentési hiba.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSupplierSync() {
    if (!product) return;
    setSyncingSupplier(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/supplier-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "single", productId: product.id }),
      });
      const payload = (await response.json()) as {
        error?: string;
        summary?: { successCount: number; attemptedCount: number };
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Beszállítói szinkron hiba.");
      }
      await (async () => {
        const productRes = await fetch(`/api/admin/products/${product.id}`, { cache: "no-store" });
        const productPayload = (await productRes.json()) as ProductResponse;
        if (!productRes.ok || !productPayload.product) {
          throw new Error(productPayload.error ?? "Nem sikerült frissíteni a termék adatát.");
        }
        setProduct(productPayload.product);
        setForm(toForm(productPayload.product));
      })();
      setNotice(
        `Beszállítói frissítés kész: ${payload.summary?.successCount ?? 0}/${payload.summary?.attemptedCount ?? 0} sikeres.`
      );
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Beszállítói frissítési hiba.");
    } finally {
      setSyncingSupplier(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white px-4 py-6 text-sm text-neutral-medium flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        Termék betöltése...
      </div>
    );
  }
  const qualityIssues = qualityIssuesFromForm(form);
  const grossPrice = Math.max(0, Number(form.price || 0));
  const activePromotionSalePrice = getActivePromotionSalePrice(form.promotions);
  const effectiveGrossPrice = activePromotionSalePrice ?? grossPrice;
  const netPrice = toNetPrice(grossPrice, BUSINESS_VAT_CODE);
  const effectiveNetPrice = toNetPrice(effectiveGrossPrice, BUSINESS_VAT_CODE);
  const vatAmount = toVatAmount(grossPrice, BUSINESS_VAT_CODE);
  const qualityTone =
    qualityIssues.length === 0
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : qualityIssues.length <= 2
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-dark tracking-tight">{form.name}</h1>
          <p className="text-sm text-neutral-medium">Termék részletes szerkesztése</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSupplierSync}
            disabled={syncingSupplier || saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${syncingSupplier ? "animate-spin" : ""}`} />
            Beszállítói frissítés
          </button>
          <Link
            href="/admin/termekek"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-neutral-dark hover:bg-gray-50"
          >
            Vissza
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Mentés
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            onClick={() => setTab(entry.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              tab === entry.id
                ? "bg-primary text-white"
                : "bg-white border border-gray-200 text-neutral-medium hover:bg-gray-50"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}
      {syncingSupplier ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <Loader2 className="size-4 animate-spin" />
            Beszállítói frissítés folyamatban...
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-amber-100 overflow-hidden">
            <div className="h-full w-1/3 animate-pulse bg-gradient-to-r from-amber-400 to-amber-600" />
          </div>
        </div>
      ) : null}
      <div className={`rounded-xl border px-4 py-3 text-sm ${qualityTone}`}>
        {qualityIssues.length === 0 ? (
          "Adatminőség rendben: a fő Merchant attribútumok kitöltve."
        ) : (
          <>
            <p className="font-semibold mb-1">Javasolt javítások a hirdetésképességhez:</p>
            <p>{qualityIssues.join(" · ")}</p>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        {tab === "altalanos" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Terméknév" value={form.name} onChange={(value) => updateForm({ name: value })} />
            <Field label="Cikkszám" value={form.sku} onChange={(value) => updateForm({ sku: value })} />
            <Field
              label="Gyártói cikkszám"
              value={form.manufacturerSku}
              onChange={(value) => updateForm({ manufacturerSku: value })}
            />
            <Field label="Vonalkód / EAN" value={form.ean} onChange={(value) => updateForm({ ean: value })} />
            <RichTextEditor
              label="Rövid leírás"
              value={form.shortDesc}
              onChange={(value) => updateForm({ shortDesc: value })}
              minHeight={140}
            />
            <RichTextEditor
              label="Hosszú leírás"
              value={form.description}
              onChange={(value) => updateForm({ description: value })}
              minHeight={260}
            />
            <Field
              label="Mértékegység neve (pl. db)"
              value={form.unitName}
              onChange={(value) => updateForm({ unitName: value })}
            />
          </div>
        ) : null}

        {tab === "adatok" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Állapot"
              value={form.isActive ? "active" : "inactive"}
              onChange={(value) => updateForm({ isActive: value === "active" })}
              options={[
                { value: "active", label: "Aktív" },
                { value: "inactive", label: "Inaktív" },
              ]}
            />
            <Field label="Termék eladási ára" value={form.price} onChange={(value) => updateForm({ price: value })} />
            <SelectField
              label="ÁFA"
              value={form.vatRate}
              onChange={(value) => updateForm({ vatRate: value })}
              options={[
                { value: BUSINESS_VAT_CODE, label: "0% AAM" },
              ]}
              disabled
            />
            <Field
              label="Termék beszerzési ára"
              value={form.purchasePrice}
              onChange={(value) => updateForm({ purchasePrice: value })}
            />
            <Field
              label="Termék beszállítói linkje"
              value={form.supplierUrl}
              onChange={(value) => updateForm({ supplierUrl: value })}
            />
            <Field label="Raktárkészlet" value={form.stock} onChange={(value) => updateForm({ stock: value })} />
            <div className="md:col-span-2 rounded-xl border border-primary/20 bg-primary-pale/30 px-4 py-3 text-sm">
              <p className="font-semibold text-neutral-dark">ÁFA/Nettó összegzés (AAM 0%)</p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-dark">
                <p>Bruttó eladási ár: <span className="font-bold">{formatPrice(grossPrice)}</span></p>
                <p>Nettó eladási ár: <span className="font-bold">{formatPrice(netPrice)}</span></p>
                <p>ÁFA összege: <span className="font-bold">{formatPrice(vatAmount)}</span></p>
                <p>
                  Nettó ár (aktuális ajánlat szerint):{" "}
                  <span className="font-bold">{formatPrice(effectiveNetPrice)}</span>
                </p>
              </div>
            </div>
            <div className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
              {(() => {
                const sellingPrice = Number(form.price || 0);
                const purchasePrice = Number(form.purchasePrice || 0);
                if (!Number.isFinite(sellingPrice) || sellingPrice <= 0 || !Number.isFinite(purchasePrice) || purchasePrice <= 0) {
                  return <span className="text-neutral-medium">Haszonkulcs számításhoz add meg a beszerzési és eladási árat.</span>;
                }
                const profitFt = sellingPrice - purchasePrice;
                const marginPercent = (profitFt / sellingPrice) * 100;
                const lowMargin = marginPercent < 8;
                return (
                  <span className={lowMargin ? "text-red-700 font-bold" : "text-emerald-700 font-bold"}>
                    {marginPercent.toFixed(1)}% Haszon: {formatPrice(Math.round(profitFt))}
                  </span>
                );
              })()}
            </div>
            <Field label="Termék mérete" value={form.sizeValue} onChange={(value) => updateForm({ sizeValue: value })} />
            <Field
              label="Méret mértékegysége"
              value={form.sizeUnit}
              onChange={(value) => updateForm({ sizeUnit: value })}
            />
            <Field label="Termék súlya" value={form.weight} onChange={(value) => updateForm({ weight: value })} />
            <Field
              label="Súly mértékegysége"
              value={form.weightUnit}
              onChange={(value) => updateForm({ weightUnit: value })}
            />
          </div>
        ) : null}

        {tab === "tulajdonsagok" ? (
          <div className="space-y-3">
            <p className="text-xs text-neutral-medium">
              Itt tudsz tulajdonságokat létrehozni, pl. szín, ajánlott életkor.
            </p>
            {form.attributeRows.map((row, index) => (
              <div key={`attr-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  value={row.key}
                  onChange={(event) => {
                    const next = [...form.attributeRows];
                    next[index] = { ...next[index], key: event.target.value };
                    updateForm({ attributeRows: next });
                  }}
                  placeholder="Tulajdonság neve"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  value={row.value}
                  onChange={(event) => {
                    const next = [...form.attributeRows];
                    next[index] = { ...next[index], value: event.target.value };
                    updateForm({ attributeRows: next });
                  }}
                  placeholder="Érték"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateForm({ attributeRows: form.attributeRows.filter((_, i) => i !== index) })
                  }
                  className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                updateForm({ attributeRows: [...form.attributeRows, { key: "", value: "" }] })
              }
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-neutral-dark hover:bg-gray-50"
            >
              <Plus className="size-4" />
              Új tulajdonság
            </button>
          </div>
        ) : null}

        {tab === "linkek" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Gyártó" value={form.manufacturer} onChange={(value) => updateForm({ manufacturer: value })} />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-neutral-dark">Kategóriák</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.categoryIds.includes(category.id)}
                      onChange={() =>
                        updateForm({
                          categoryIds: toggleArrayValue(form.categoryIds, category.id),
                        })
                      }
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-dark">Csatolt dokumentumok</p>
              {form.documents.map((document, index) => (
                <div key={`doc-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                  <input
                    value={document.name}
                    onChange={(event) => {
                      const next = [...form.documents];
                      next[index] = { ...next[index], name: event.target.value };
                      updateForm({ documents: next });
                    }}
                    placeholder="Dokumentum neve"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    value={document.url}
                    onChange={(event) => {
                      const next = [...form.documents];
                      next[index] = { ...next[index], url: event.target.value };
                      updateForm({ documents: next });
                    }}
                    placeholder="Dokumentum URL"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => updateForm({ documents: form.documents.filter((_, i) => i !== index) })}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateForm({ documents: [...form.documents, { name: "", url: "" }] })}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-neutral-dark hover:bg-gray-50"
              >
                <Plus className="size-4" />
                Új dokumentum
              </button>
            </div>
          </div>
        ) : null}

        {tab === "mukodes" ? (
          <div className="text-sm text-neutral-medium rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            A működéshez kapcsolódó fő beállítások az Állapot, Készlet és Fizetés/szállítás tabokon érhetők el.
          </div>
        ) : null}

        {tab === "akciok" ? (
          <div className="space-y-2">
            {form.promotions.map((promotion, index) => (
              <div
                key={`promo-${index}`}
                className="rounded-xl border border-gray-200 p-3 grid grid-cols-1 md:grid-cols-4 gap-2"
              >
                <input
                  value={promotion.name}
                  onChange={(event) => {
                    const next = [...form.promotions];
                    next[index] = { ...next[index], name: event.target.value };
                    updateForm({ promotions: next });
                  }}
                  placeholder="Akció neve"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="datetime-local"
                  value={promotion.startAt}
                  onChange={(event) => {
                    const next = [...form.promotions];
                    next[index] = { ...next[index], startAt: event.target.value };
                    updateForm({ promotions: next });
                  }}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="datetime-local"
                  value={promotion.endAt}
                  onChange={(event) => {
                    const next = [...form.promotions];
                    next[index] = { ...next[index], endAt: event.target.value };
                    updateForm({ promotions: next });
                  }}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={promotion.salePrice}
                    onChange={(event) => {
                      const next = [...form.promotions];
                      next[index] = { ...next[index], salePrice: event.target.value };
                      updateForm({ promotions: next });
                    }}
                    placeholder="Akciós ár"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateForm({ promotions: form.promotions.filter((_, i) => i !== index) })
                    }
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                updateForm({
                  promotions: [...form.promotions, { name: "", startAt: "", endAt: "", salePrice: "" }],
                })
              }
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-neutral-dark hover:bg-gray-50"
            >
              <Plus className="size-4" />
              Új akció
            </button>
          </div>
        ) : null}

        {tab === "kepek" ? (
          <div className="space-y-2">
            {form.images.map((image, index) => (
              <div key={`img-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                <input
                  value={image}
                  onChange={(event) => {
                    const next = [...form.images];
                    next[index] = event.target.value;
                    updateForm({ images: next });
                  }}
                  placeholder="Kép URL"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => updateForm({ images: form.images.filter((_, i) => i !== index) })}
                  className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateForm({ images: [...form.images, ""] })}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-neutral-dark hover:bg-gray-50"
            >
              <Plus className="size-4" />
              Új kép
            </button>
          </div>
        ) : null}

        {tab === "fizetes-szallitas" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="mb-2 text-xs font-semibold text-neutral-dark">Kizárt fizetési módok</p>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.excludedPaymentMethods.includes(method.id)}
                      onChange={() =>
                        updateForm({
                          excludedPaymentMethods: toggleArrayValue(
                            form.excludedPaymentMethods,
                            method.id
                          ),
                        })
                      }
                    />
                    {method.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-neutral-dark">Kizárt szállítási módok</p>
              <div className="space-y-2">
                {(Object.keys(SHIPPING_METHOD_LABELS) as ShippingMethod[]).map((method) => (
                  <label
                    key={method}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.excludedShippingMethods.includes(method)}
                      onChange={() =>
                        updateForm({
                          excludedShippingMethods: toggleArrayValue(
                            form.excludedShippingMethods,
                            method
                          ),
                        })
                      }
                    />
                    {SHIPPING_METHOD_LABELS[method]}
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-neutral-dark">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-neutral-dark">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100 disabled:text-neutral-medium disabled:cursor-not-allowed"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RichTextEditor({
  label,
  value,
  onChange,
  minHeight = 180,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function runCommand(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML ?? "");
  }

  return (
    <div className="block">
      <span className="mb-1 block text-xs font-semibold text-neutral-dark">{label}</span>
      <div className="rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
          <button type="button" onClick={() => runCommand("bold")} className="rounded-md p-1.5 hover:bg-white">
            <Bold className="size-4" />
          </button>
          <button type="button" onClick={() => runCommand("italic")} className="rounded-md p-1.5 hover:bg-white">
            <Italic className="size-4" />
          </button>
          <button type="button" onClick={() => runCommand("underline")} className="rounded-md p-1.5 hover:bg-white">
            <Underline className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => runCommand("insertUnorderedList")}
            className="rounded-md p-1.5 hover:bg-white"
          >
            <List className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => runCommand("insertOrderedList")}
            className="rounded-md p-1.5 hover:bg-white"
          >
            <ListOrdered className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const link = window.prompt("Link URL", "https://");
              if (link) runCommand("createLink", link);
            }}
            className="rounded-md p-1.5 hover:bg-white"
          >
            <Link2 className="size-4" />
          </button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
          className="px-3 py-2 text-sm focus:outline-none"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}
