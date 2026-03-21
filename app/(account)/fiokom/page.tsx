"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, Heart, MapPin, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";
import { useWishlistStore } from "@/store/wishlistStore";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Feldolgozás alatt",
  CONFIRMED: "Megerősítve",
  PROCESSING: "Előkészítés",
  SHIPPED: "Kiszállítva",
  DELIVERED: "Átvéve",
  CANCELLED: "Törölve",
  REFUNDED: "Visszatérítve",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-neutral-pale text-neutral-medium",
  CONFIRMED: "bg-primary-pale text-primary",
  PROCESSING: "bg-primary-pale text-primary",
  SHIPPED: "bg-secondary/20 text-secondary",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-amber-100 text-amber-700",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function FiokomPage() {
  const [userName, setUserName] = useState("Vásárló");
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [addressesCount, setAddressesCount] = useState(0);
  const wishlistCount = useWishlistStore((state) => state.items.length);

  useEffect(() => {
    let active = true;
    async function loadAccountData() {
      try {
        const profileResponse = await fetch("/api/account/profile", { cache: "no-store" });
        if (!profileResponse.ok) return;
        const profilePayload = (await profileResponse.json()) as {
          user?: { name?: string; email?: string; addresses?: unknown[] };
        };
        const user = profilePayload.user;
        if (!user || !active) return;
        if (user.name?.trim()) {
          setUserName(user.name.trim());
        } else if (user.email?.includes("@")) {
          setUserName(user.email.split("@")[0]);
        }
        setAddressesCount(Array.isArray(user.addresses) ? user.addresses.length : 0);

        if (user.email) {
          const ordersResponse = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}`, {
            cache: "no-store",
          });
          if (!ordersResponse.ok || !active) return;
          const orderPayload = (await ordersResponse.json()) as { orders?: Order[] };
          const orders = orderPayload.orders ?? [];
          setOrdersCount(orders.length);
          setRecentOrders(orders.slice(0, 3));
        }
      } catch {
        if (active) setUserName("Vásárló");
      }
    }
    loadAccountData();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-dark mb-2">
          Fiókom
        </h1>
        <p className="text-neutral-medium">
          Üdvözlünk, {userName}! 👋
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        <Link
          href="/rendeleseim"
          className="card p-5 hover:shadow-medium transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-pale flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <Package className="size-6 text-primary group-hover:text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-2xl text-neutral-dark">
                {ordersCount}
              </div>
              <div className="text-neutral-medium text-sm">Rendeléseim</div>
            </div>
          </div>
        </Link>
        <Link
          href="/kivansaglista"
          className="card p-5 hover:shadow-medium transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-pale flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <Heart className="size-6 text-primary group-hover:text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-2xl text-neutral-dark">
                {wishlistCount}
              </div>
              <div className="text-neutral-medium text-sm">Kívánságlista</div>
            </div>
          </div>
        </Link>
        <Link
          href="/cimeim"
          className="card p-5 hover:shadow-medium transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-pale flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <MapPin className="size-6 text-primary group-hover:text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-2xl text-neutral-dark">
                {addressesCount}
              </div>
              <div className="text-neutral-medium text-sm">Mentett címek</div>
            </div>
          </div>
        </Link>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h2 className="text-xl font-extrabold tracking-tight text-neutral-dark mb-4">
          Legutóbbi rendelések
        </h2>
        <div className="space-y-4">
          {recentOrders.length === 0 && (
            <div className="card p-5 text-sm text-neutral-medium">
              Még nincs rendelésed.
            </div>
          )}
          {recentOrders.map((order) => (
            <Link
              key={order.id}
              href="/rendeleseim"
              className="card p-5 hover:shadow-medium transition-shadow block"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="font-semibold text-neutral-dark">
                    {order.orderNumber}
                  </div>
                  <div className="text-sm text-neutral-medium">
                    {formatDate(order.createdAt)} • {order.items.length} termék
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "badge",
                      STATUS_COLORS[order.status] ?? STATUS_COLORS.PENDING
                    )}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                  <span className="font-bold text-primary">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-8 flex flex-wrap gap-3"
      >
        <Link href="/rendeleseim" className="btn-primary">
          Összes rendelés
        </Link>
        <Link href="/beallitasok" className="btn-outline flex items-center gap-2">
          <Settings className="size-4" />
          Beállítások
        </Link>
      </motion.div>
    </div>
  );
}
