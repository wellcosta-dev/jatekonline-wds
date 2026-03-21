"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShieldCheck, Sparkles, Truck, X } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/utils";

const STORAGE_KEY = "bo-free-shipping-popup-dismissed-at";
const REOPEN_AFTER_MS = 24 * 60 * 60 * 1000;

export function FreeShippingPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissedAtRaw = window.localStorage.getItem(STORAGE_KEY);
    const dismissedAt = dismissedAtRaw ? Number(dismissedAtRaw) : 0;
    const allowOpen = !dismissedAt || Date.now() - dismissedAt > REOPEN_AFTER_MS;
    if (!allowOpen) return;

    const timeout = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(timeout);
  }, []);

  const close = () => {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-[1px] p-4 sm:p-6 grid place-items-center"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 z-20 rounded-full p-2 text-neutral-medium/90 hover:bg-white hover:text-neutral-dark"
              aria-label="Popup bezárása"
            >
              <X className="size-4" />
            </button>

            <div className="relative bg-gradient-to-br from-primary-pale via-white to-brand-cyan/10 px-6 pb-6 pt-10 sm:px-8 sm:pt-12">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-3 py-1 text-xs font-bold text-primary backdrop-blur-sm">
                <Sparkles className="size-3.5" />
                Kiemelt ajánlat
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-dark leading-tight">
                Ingyenes szállítás
                <span className="block text-primary">{formatPrice(FREE_SHIPPING_THRESHOLD)} felett</span>
              </h3>

              <p className="mt-3 max-w-xl text-sm sm:text-base text-neutral-medium leading-relaxed">
                Tedd a kedvenc termékeidet a kosárba, és a szállítás díját mi álljuk. Ez egy egyszerű
                lehetőség arra, hogy többet kapj ugyanazért az árért.
              </p>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-dark">
                  <Truck className="size-4 text-primary" />
                  0 Ft szállítás
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-dark">
                  <ShieldCheck className="size-4 text-primary" />
                  Biztonságos fizetés
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-primary/20 bg-white p-4">
                <p className="text-sm font-bold text-neutral-dark">
                  TIPP: Már csak egy nagyobb kosárérték, és a szállítási díj automatikusan eltűnik.
                </p>
                <p className="mt-1 text-xs text-neutral-medium">
                  A kedvezmény a pénztárban azonnal érvényesül, ha eléred a {formatPrice(FREE_SHIPPING_THRESHOLD)} összeghatárt.
                </p>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
                <Link
                  href="/termekek"
                  onClick={close}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-colors hover:bg-primary-light"
                >
                  Vásárlás megkezdése
                </Link>
                <Link
                  href="/akciok"
                  onClick={close}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-sm font-bold text-neutral-dark transition-colors hover:bg-gray-50"
                >
                  Akciós termékek
                </Link>
              </div>

              <button
                type="button"
                onClick={close}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-neutral-medium hover:text-neutral-dark"
              >
                <CheckCircle2 className="size-3.5" />
                Most nem kérem, később megnézem
              </button>
            </div>
            <div className="border-t border-gray-100 bg-white px-6 py-3 sm:px-8">
              <p className="text-[11px] text-neutral-medium">
                A felugró ajánlat bezárás után 24 órán át nem jelenik meg újra.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
