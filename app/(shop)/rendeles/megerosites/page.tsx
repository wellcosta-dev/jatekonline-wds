"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  Package,
  Mail,
  ArrowRight,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { useCartStore } from "@/store/cartStore";
import { trackEvent } from "@/lib/analytics";

function MegerositesContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") ?? "BO-XXXXXX";
  const purchaseEventId = searchParams.get("eid");
  const trackedValue = Number(searchParams.get("v") ?? 0);
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!purchaseEventId || !orderNumber || !Number.isFinite(trackedValue) || trackedValue <= 0) return;
    const key = `bo-purchase-tracked-${orderNumber}-${purchaseEventId}`;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(key) === "1") return;
    trackEvent("purchase", {
      transaction_id: orderNumber,
      value: trackedValue,
      currency: "HUF",
      payment_type: "card",
      event_id: purchaseEventId,
      items: [],
    });
    window.sessionStorage.setItem(key, "1");
  }, [orderNumber, purchaseEventId, trackedValue]);

  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Rendelés megerősítés" },
          ]}
          className="mb-8"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Success animation */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="inline-flex items-center justify-center size-24 rounded-3xl bg-emerald-500 text-white mb-8 shadow-lg shadow-emerald-200"
          >
            <Check className="size-14" strokeWidth={2.5} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-4xl font-extrabold text-neutral-dark mb-3 tracking-tight"
          >
            Köszönjük a rendelésed!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-neutral-medium mb-6"
          >
            A rendelésed sikeresen leadásra került.
          </motion.p>

          {/* Order number card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary/5 border border-primary/10 mb-8"
          >
            <span className="text-sm text-neutral-medium">Rendelésszám:</span>
            <span className="text-lg font-extrabold text-primary tracking-tight">{orderNumber}</span>
          </motion.div>

          {/* Info cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid sm:grid-cols-2 gap-3 mb-8"
          >
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
                  <Mail className="size-5 text-brand-cyan" />
                </div>
                <h3 className="text-sm font-bold text-neutral-dark tracking-tight">Email visszaigazolás</h3>
              </div>
              <p className="text-xs text-neutral-medium leading-relaxed">
                A rendelésed részleteit elküldtük az email címedre. Kérjük, ellenőrizd a spam mappát is.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Truck className="size-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-neutral-dark tracking-tight">Szállítás</h3>
              </div>
              <p className="text-xs text-neutral-medium leading-relaxed">
                A csomagodat 1-3 munkanapon belül kézbesítjük. Nyomonkövetési információt emailben küldünk.
              </p>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              href="/rendeleseim"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-light transition-colors shadow-lg shadow-primary/20"
            >
              <Package className="size-4" />
              Rendelés követése
            </Link>
            <Link
              href="/termekek"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gray-100 text-neutral-dark font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              <ShoppingBag className="size-4" />
              Vásárlás folytatása
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function MegerositesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-pale flex items-center justify-center">
          <div className="animate-pulse text-neutral-medium">Betöltés...</div>
        </div>
      }
    >
      <MegerositesContent />
    </Suspense>
  );
}
