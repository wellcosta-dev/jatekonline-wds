"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";
import { SHIPPING_METHOD_LABELS, type ShippingMethod } from "@/lib/shipping";

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Függőben",
  CONFIRMED: "Megerősítve",
  PROCESSING: "Feldolgozás",
  SHIPPED: "Szállítás alatt",
  DELIVERED: "Kézbesítve",
  CANCELLED: "Törölve",
  REFUNDED: "Visszatérítve",
};

function shippingMethodLabel(method: string): string {
  if ((method as ShippingMethod) in SHIPPING_METHOD_LABELS) {
    return SHIPPING_METHOD_LABELS[method as ShippingMethod];
  }
  return method;
}

function paymentMethodLabel(method: string): string {
  const normalized = method.trim().toLowerCase();
  if (normalized === "card") return "Bankkártya";
  if (normalized === "cod") return "Utánvét";
  if (normalized === "transfer") return "Banki átutalás";
  return method;
}

export default function AdminRendelesekPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [shippingFilter, setShippingFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        if (!response.ok) throw new Error("Nem sikerült betölteni a rendeléseket.");
        const data = (await response.json()) as { orders: Order[] };
        setOrders(data.orders ?? []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Ismeretlen hiba történt.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const shippingMethods = useMemo(
    () => Array.from(new Set(orders.map((order) => order.shippingMethod).filter(Boolean))),
    [orders]
  );
  const paymentMethods = useMemo(
    () => Array.from(new Set(orders.map((order) => order.paymentMethod).filter(Boolean))),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = search.trim().toLowerCase();
      const orderText = `${order.orderNumber} ${order.shippingAddress.name} ${order.guestEmail ?? ""}`.toLowerCase();
      const searchMatch = !q || orderText.includes(q);

      const productQ = productSearch.trim().toLowerCase();
      const productMatch =
        !productQ ||
        order.items.some(
          (item) =>
            item.productName.toLowerCase().includes(productQ) ||
            item.productId.toLowerCase().includes(productQ)
        );

      const statusMatch = !statusFilter || order.status === statusFilter;
      const shippingMatch = !shippingFilter || order.shippingMethod === shippingFilter;
      const paymentMatch = !paymentFilter || order.paymentMethod === paymentFilter;

      const created = new Date(order.createdAt).getTime();
      const fromOk = !dateFrom || created >= new Date(`${dateFrom}T00:00:00`).getTime();
      const toOk = !dateTo || created <= new Date(`${dateTo}T23:59:59`).getTime();

      return (
        searchMatch &&
        productMatch &&
        statusMatch &&
        shippingMatch &&
        paymentMatch &&
        fromOk &&
        toOk
      );
    });
  }, [orders, search, productSearch, statusFilter, shippingFilter, paymentFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-neutral-dark tracking-tight">Rendeléskezelés</h1>
        <p className="text-sm text-neutral-medium">{filteredOrders.length} rendelés</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-3">
        <label className="relative md:col-span-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-medium" />
          <input
            type="search"
            placeholder="Rendelés / vevő"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <input
          type="search"
          placeholder="Termék kereső"
          value={productSearch}
          onChange={(event) => setProductSearch(event.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Állapot</option>
          {(Object.keys(statusLabels) as OrderStatus[]).map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>

        <select
          value={shippingFilter}
          onChange={(event) => setShippingFilter(event.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Szállítási mód</option>
          {shippingMethods.map((method) => (
            <option key={method} value={method}>
              {shippingMethodLabel(method)}
            </option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(event) => setPaymentFilter(event.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Fizetési mód</option>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>
              {paymentMethodLabel(method)}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {loading ? <div className="text-sm text-neutral-medium">Rendelések betöltése...</div> : null}
      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {!loading ? (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Rendelés ID
                </th>
                <th className="text-left px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Vevő
                </th>
                <th className="text-left px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Állapot
                </th>
                <th className="text-left px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Szállítási mód
                </th>
                <th className="text-left px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Fizetési mód
                </th>
                <th className="text-left px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Dátum
                </th>
                <th className="text-right px-3 py-3 text-xs font-bold uppercase text-neutral-medium">
                  Érték
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/70">
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/rendelesek/${order.id}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-semibold text-neutral-dark">
                      {order.shippingAddress.name}
                    </div>
                    <div className="text-xs text-neutral-medium">
                      {order.guestEmail || order.shippingAddress.email || "-"}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-neutral-dark">
                    {statusLabels[order.status] ?? order.status}
                  </td>
                  <td className="px-3 py-3 text-sm text-neutral-dark">
                    {shippingMethodLabel(order.shippingMethod)}
                  </td>
                  <td className="px-3 py-3 text-sm text-neutral-dark">
                    {paymentMethodLabel(order.paymentMethod)}
                  </td>
                  <td className="px-3 py-3 text-sm text-neutral-dark">
                    {new Date(order.createdAt).toLocaleString("hu-HU")}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-bold text-neutral-dark">
                    {formatPrice(order.total)}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-neutral-medium">
                    Nincs találat.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
