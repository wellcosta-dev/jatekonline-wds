"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Users,
  ArrowUpRight,
  Clock,
  CheckCircle,
  Truck,
  Eye,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";
import type { Order, Product } from "@/types";

type AdminCustomer = {
  id: string;
  email: string;
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  PENDING: { label: "Függőben", icon: Clock, color: "text-amber-700", bg: "bg-amber-50" },
  CONFIRMED: { label: "Megerősítve", icon: CheckCircle, color: "text-blue-700", bg: "bg-blue-50" },
  PROCESSING: { label: "Feldolgozás", icon: Clock, color: "text-sky-700", bg: "bg-sky-50" },
  SHIPPED: { label: "Szállítva", icon: Truck, color: "text-purple-700", bg: "bg-purple-50" },
  DELIVERED: { label: "Kézbesítve", icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-50" },
  CANCELLED: { label: "Törölve", icon: AlertTriangle, color: "text-red-700", bg: "bg-red-50" },
  REFUNDED: { label: "Visszatérítve", icon: AlertTriangle, color: "text-neutral-700", bg: "bg-neutral-100" },
};

function getLocalDateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("");

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setLoadError(null);
      try {
        const [ordersRes, productsRes, customersRes] = await Promise.all([
          fetch("/api/orders", { cache: "no-store" }),
          fetch("/api/products?limit=5000", { cache: "no-store" }),
          fetch("/api/admin/customers", { cache: "no-store" }),
        ]);

        if (!ordersRes.ok) {
          throw new Error("A rendelések betöltése sikertelen.");
        }
        if (!productsRes.ok) {
          throw new Error("A termékek betöltése sikertelen.");
        }

        const ordersPayload = (await ordersRes.json()) as { orders: Order[] };
        const productsPayload = (await productsRes.json()) as { products: Product[] };
        setOrders(ordersPayload.orders ?? []);
        setProducts(productsPayload.products ?? []);

        if (customersRes.ok) {
          const customersPayload = (await customersRes.json()) as { customers: AdminCustomer[] };
          setCustomers(customersPayload.customers ?? []);
        } else {
          setCustomers([]);
        }
        setLastUpdatedAt(new Date().toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" }));
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Nem sikerült betölteni a dashboard adatokat.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const {
    revenueData,
    dailyRevenue,
    dailyOrders,
    lowStockCount,
    recentOrders,
    topProducts,
    lowMarginProducts,
  } = useMemo(() => {
    const today = new Date();
    const todayKey = getLocalDateKey(today);

    const validOrders = orders.filter((order) => order.status !== "CANCELLED");
    const todayOrders = validOrders.filter((order) => getLocalDateKey(order.createdAt) === todayKey);

    const dayBuckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - (6 - index));
      const key = getLocalDateKey(date);
      return {
        key,
        day: date.toLocaleDateString("hu-HU", { weekday: "short" }).replace(".", ""),
        value: 0,
      };
    });

    const bucketMap = new Map(dayBuckets.map((bucket) => [bucket.key, bucket]));
    for (const order of validOrders) {
      const key = getLocalDateKey(order.createdAt);
      const bucket = bucketMap.get(key);
      if (bucket) {
        bucket.value += order.total;
      }
    }

    const productStats = new Map<string, { name: string; sold: number; revenue: number }>();
    for (const order of validOrders) {
      for (const item of order.items) {
        const current = productStats.get(item.productId) ?? {
          name: item.productName,
          sold: 0,
          revenue: 0,
        };
        current.sold += item.quantity;
        current.revenue += item.price * item.quantity;
        productStats.set(item.productId, current);
      }
    }

    const top = Array.from(productStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    const recent = validOrders
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((order) => ({
        id: order.orderNumber,
        customer: order.shippingAddress?.name || order.guestEmail || "Ismeretlen vásárló",
        total: order.total,
        status: order.status,
        date: new Date(order.createdAt).toLocaleDateString("hu-HU", { month: "short", day: "numeric" }),
      }));

    return {
      revenueData: dayBuckets,
      dailyRevenue: todayOrders.reduce((sum, order) => sum + order.total, 0),
      dailyOrders: todayOrders.length,
      lowStockCount: products.filter((product) => product.stock > 0 && product.stock < 5).length,
      lowMarginProducts: products
        .map((product) => {
          const sellingPrice = Number(product.salePrice ?? product.price);
          const purchasePrice = Number(product.purchasePrice);
          if (!Number.isFinite(sellingPrice) || sellingPrice <= 0 || !Number.isFinite(purchasePrice) || purchasePrice <= 0) {
            return null;
          }
          const profitFt = sellingPrice - purchasePrice;
          const marginPercent = (profitFt / sellingPrice) * 100;
          return {
            id: product.id,
            name: product.name,
            marginPercent,
            profitFt,
          };
        })
        .filter((entry): entry is { id: string; name: string; marginPercent: number; profitFt: number } => Boolean(entry))
        .filter((entry) => entry.marginPercent < 8)
        .sort((a, b) => a.marginPercent - b.marginPercent),
      recentOrders: recent,
      topProducts: top,
    };
  }, [orders, products]);

  const maxRevenue = Math.max(...revenueData.map((d) => d.value), 1);
  const kpiCards = [
    {
      title: "Mai bevétel",
      value: formatPrice(dailyRevenue),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      panel: "bg-emerald-50/60 border-violet-300",
      desc: "mai érvényes rendelések alapján",
    },
    {
      title: "Mai rendelések",
      value: String(dailyOrders),
      icon: ShoppingCart,
      color: "text-primary",
      bg: "bg-primary/10",
      panel: "bg-indigo-50/70 border-violet-300",
      desc: "mai rendelési darabszám",
    },
    {
      title: "Vásárlók",
      value: String(customers.length),
      icon: Users,
      color: "text-brand-cyan",
      bg: "bg-brand-cyan/10",
      panel: "bg-cyan-50/70 border-violet-300",
      desc: "regisztrált ügyfelek száma",
    },
    {
      title: "Alacsony készlet",
      value: String(lowStockCount),
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-100",
      panel: "bg-amber-50/70 border-violet-300",
      desc: "5 db alatti készletű termékek",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-dark tracking-tight">Dashboard</h1>
          <p className="text-sm text-neutral-medium mt-0.5">Valós admin adatok összesítése</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-medium bg-white rounded-xl border border-gray-200 px-3 py-2">
          <Clock className="size-3.5" />
          <span>Utolsó frissítés: {lastUpdatedAt || "-"}</span>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}
      {!loading && lowMarginProducts.length > 0 ? (
        <div className="rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-3 shadow-md shadow-red-100">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="size-4" />
            <p className="text-sm font-extrabold tracking-tight">
              Figyelem: {lowMarginProducts.length} termék árrése 8% alatt van
            </p>
          </div>
          <p className="mt-1 text-xs text-red-700">
            Kritikus termékek:{" "}
            {lowMarginProducts
              .slice(0, 3)
              .map(
                (entry) =>
                  `${entry.name} (${entry.marginPercent.toFixed(1)}%, haszon ${formatPrice(Math.round(entry.profitFt))})`
              )
              .join(" · ")}
            {lowMarginProducts.length > 3 ? " · ..." : ""}
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="bg-indigo-50/70 rounded-2xl border border-violet-300 p-8 flex items-center gap-2 text-sm text-neutral-medium">
          <Loader2 className="size-4 animate-spin" />
          Dashboard adatok betöltése...
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className={cn("rounded-2xl border-2 p-5 shadow-md shadow-violet-300/40 hover:shadow-lg transition-shadow", card.panel)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("size-10 rounded-xl flex items-center justify-center", card.bg)}>
                      <Icon className={cn("size-5", card.color)} />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-neutral-dark tracking-tight">{card.value}</p>
                  <p className="text-[11px] text-neutral-medium mt-0.5">{card.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-indigo-50/60 rounded-2xl border-2 border-violet-300 p-5 shadow-md shadow-violet-300/40">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-bold text-neutral-dark tracking-tight">Bevétel (utolsó 7 nap)</h2>
                  <p className="text-xs text-neutral-medium mt-0.5">Összesen: {formatPrice(revenueData.reduce((a, b) => a + b.value, 0))}</p>
                </div>
              </div>
              <div className="flex items-end gap-2 h-44">
                {revenueData.map((d) => (
                  <div key={d.key} className="flex-1 h-full flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-neutral-dark">{formatPrice(d.value)}</span>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-primary to-primary-light rounded-lg hover:from-primary-light hover:to-primary transition-all cursor-default"
                        style={{ height: d.value > 0 ? `${(d.value / maxRevenue) * 100}%` : "0%" }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-medium">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI section without mock data */}
            <div className="bg-cyan-50/60 rounded-2xl border-2 border-violet-300 p-5 shadow-md shadow-violet-300/40">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-neutral-dark tracking-tight">AI Agentek</h2>
                <Link href="/admin/ai-agentek" className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5">
                  Részletek <ArrowUpRight className="size-3" />
                </Link>
              </div>
              <p className="text-xs text-neutral-medium leading-relaxed">
                Az AI agent modul valós futási adatai külön oldalon érhetők el.
              </p>
              <Link
                href="/admin/ai-agentek"
                className="mt-4 inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-neutral-dark hover:bg-gray-50 transition-colors"
              >
                <Eye className="size-3.5" />
                AI agentek megnyitása
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-violet-50/55 rounded-2xl border-2 border-violet-300 overflow-hidden shadow-md shadow-violet-300/40">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-neutral-dark tracking-tight">Legutóbbi rendelések</h2>
                <Link href="/admin/rendelesek" className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5">
                  Összes <ArrowUpRight className="size-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recentOrders.length === 0 && (
                  <div className="px-5 py-8 text-sm text-neutral-medium">Még nincs rendelés adat.</div>
                )}
                {recentOrders.map((order) => {
                  const status = statusConfig[order.status] ?? statusConfig.PENDING;
                  const StatusIcon = status.icon;
                  return (
                    <div key={order.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">{order.id}</span>
                          <span className="text-[10px] text-neutral-medium">{order.date}</span>
                        </div>
                        <p className="text-xs text-neutral-dark font-medium mt-0.5">{order.customer}</p>
                      </div>
                      <span className="text-xs font-extrabold text-neutral-dark">{formatPrice(order.total)}</span>
                      <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold", status.bg, status.color)}>
                        <StatusIcon className="size-3" />
                        {status.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-amber-50/55 rounded-2xl border-2 border-violet-300 p-5 shadow-md shadow-violet-300/40">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-neutral-dark tracking-tight">Top termékek</h2>
                <Link href="/admin/termekek" className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5">
                  Összes <ArrowUpRight className="size-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {topProducts.length === 0 && (
                  <p className="text-xs text-neutral-medium">Nincs elegendő rendelési adat toplista számításhoz.</p>
                )}
                {topProducts.map((product, i) => (
                  <div key={product.name} className="flex items-center gap-3">
                    <span className="size-7 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-neutral-medium">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-dark tracking-tight truncate">{product.name}</p>
                      <p className="text-[10px] text-neutral-medium">{product.sold} eladva</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">{formatPrice(product.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
