"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2, ShoppingBag, Clock, Truck, Minus, Plus, ArrowRight } from "lucide-react";
import { useCartStore, type CartItem } from "@/store/cartStore";
import {
  SHIPPING_METHOD_LABELS,
  SHIPPING_METHOD_LOGOS,
  type ShippingMethod,
} from "@/lib/shipping";
import { cn, formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/utils";

function getItemPrice(item: CartItem): number {
  return item.product.salePrice ?? item.product.price;
}

const SHIPPING_METHODS: ShippingMethod[] = [
  "gls",
  "gls-csomagautomata",
  "gls-csomagpont",
  "magyar-posta",
];

function CartDrawerItem({
  item,
  onRemove,
}: {
  item: CartItem;
  onRemove: () => void;
}) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const price = getItemPrice(item);
  const lineTotal = price * item.quantity;
  const isPreorder = item.product.stock === 0;
  const maxQuantity = item.product.stock > 0 ? item.product.stock : 99;
  const atMax = item.quantity >= maxQuantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      className="group relative bg-white rounded-2xl border border-gray-100 p-3 hover:border-gray-200 transition-colors"
    >
      <div className="flex gap-3">
        {/* Product image */}
        <Link
          href={`/termekek/${item.product.slug}`}
          className="relative flex-shrink-0 w-20 h-20 rounded-xl bg-gray-50 overflow-hidden"
        >
          {item.product.images?.[0] ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.product.images[0]}
              alt={item.product.name}
              className="w-full h-full object-contain p-1.5"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary-pale/20" />
          )}
        </Link>

        <div className="flex-1 min-w-0">
          {/* Name + remove */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/termekek/${item.product.slug}`}
                className="text-sm font-semibold text-neutral-dark hover:text-primary transition-colors line-clamp-2 leading-snug"
              >
                {item.product.name}
              </Link>
              {isPreorder && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-1 text-[9px] font-bold rounded uppercase tracking-wide bg-brand-cyan text-white">
                  <Clock className="size-2.5" strokeWidth={2.5} /> Előrendelhető
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="flex size-11 flex-shrink-0 items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Eltávolítás"
            >
              <X className="size-4" />
            </button>
          </div>

          {item.variant && (item.variant.size || item.variant.color) && (
            <p className="text-xs text-neutral-medium mt-0.5">
              {[item.variant.size, item.variant.color].filter(Boolean).join(" • ")}
            </p>
          )}

          {/* Quantity + price row */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="inline-flex items-center rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  updateQuantity(
                    item.product.id,
                    Math.max(0, item.quantity - 1),
                    item.variant
                  )
                }
                className="p-2.5 text-neutral-medium hover:text-primary hover:bg-primary-pale/50 transition-colors"
                aria-label="Csökkentés"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-[2.25rem] text-center text-sm font-bold text-neutral-dark bg-gray-50 py-2.5">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateQuantity(
                    item.product.id,
                    item.quantity + 1,
                    item.variant
                  )
                }
                disabled={atMax}
                className="p-2.5 text-neutral-medium hover:text-primary hover:bg-primary-pale/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Növelés"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <span className="text-sm font-extrabold text-neutral-dark">
              {formatPrice(lineTotal)}
            </span>
          </div>
          {atMax && (
            <p className="mt-1 text-[11px] font-medium text-amber-700">
              Maximum: {maxQuantity} db
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function CartDrawer() {
  const [undoItem, setUndoItem] = useState<CartItem | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);
  const {
    items,
    isDrawerOpen,
    setDrawerOpen,
    itemCount,
    subtotal,
    shippingCost,
    total,
    couponCode,
    discount,
    removeItem,
    addItem,
    selectedShippingMethod,
    setShippingMethod,
  } = useCartStore();

  const handleRemove = (item: CartItem) => {
    removeItem(item.product.id, item.variant);
    setUndoItem(item);
    if (undoTimeoutRef.current) window.clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = window.setTimeout(() => {
      setUndoItem(null);
      undoTimeoutRef.current = null;
    }, 5000);
  };

  const handleUndo = () => {
    if (!undoItem) return;
    addItem(undoItem.product, undoItem.quantity, undoItem.variant);
    setUndoItem(null);
    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  };

  const sub = subtotal();
  const ship = shippingCost();
  const tot = total();
  const count = itemCount();
  const hasFreeShipping = sub >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - sub);
  const progressPercent = Math.min(100, (sub / FREE_SHIPPING_THRESHOLD) * 100);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        window.clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[420px] bg-neutral-pale flex flex-col shadow-2xl"
            aria-modal="true"
            role="dialog"
            aria-label="Kosár"
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-dark tracking-tight">
                    Kosár
                  </h2>
                  <p className="text-xs text-neutral-medium">
                    {count} {count === 1 ? "termék" : "termék"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="size-9 flex items-center justify-center rounded-xl text-neutral-medium hover:text-neutral-dark hover:bg-gray-100 transition-colors"
                aria-label="Bezárás"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Free shipping progress */}
            {items.length > 0 && (
              <div className="flex-shrink-0 px-5 py-3 bg-white border-b border-gray-100">
                {hasFreeShipping ? (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Truck className="size-4" />
                    <span className="text-xs font-bold">Ingyenes szállítás!</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-neutral-medium">
                        <Truck className="size-3.5" />
                        <span className="text-xs font-medium">
                          Még <strong className="text-primary">{formatPrice(remainingForFreeShipping)}</strong> az ingyenes szállításig
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-brand-cyan rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100 mx-1 mt-4">
                  <div className="size-20 rounded-2xl bg-primary-pale/50 flex items-center justify-center mb-4">
                    <ShoppingBag className="size-10 text-primary/50" />
                  </div>
                  <p className="text-lg font-bold text-neutral-dark mb-1 tracking-tight">
                    A kosarad üres
                  </p>
                  <p className="text-sm text-neutral-medium mb-5">
                    Böngéssz termékeink között!
                  </p>
                  <Link
                    href="/termekek"
                    onClick={() => setDrawerOpen(false)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-light transition-colors"
                  >
                    Vásárlás megkezdése
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <CartDrawerItem
                        key={`${item.product.id}-${item.variant?.size ?? ""}-${item.variant?.color ?? ""}`}
                        item={item}
                        onRemove={() => handleRemove(item)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
            {undoItem && (
              <div className="mx-4 mb-2 rounded-xl bg-neutral-dark/95 px-3 py-2 text-xs text-white">
                <div className="flex items-center justify-between gap-2">
                  <span>Termék eltávolítva.</span>
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="rounded-md bg-white/10 px-2 py-1 font-semibold hover:bg-white/20"
                  >
                    Visszavonás
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            {items.length > 0 && (
              <div className="flex-shrink-0 bg-white border-t border-gray-200 p-5 space-y-4">
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-medium">
                    Szállítási mód
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SHIPPING_METHODS.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setShippingMethod(method)}
                        className={cn(
                          "min-h-11 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition-colors",
                          selectedShippingMethod === method
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-neutral-dark hover:bg-gray-200"
                        )}
                      >
                        <span className="flex items-center gap-1.5 text-left">
                          <span className="inline-flex h-5 w-10 items-center justify-center rounded bg-white/90 px-1">
                            <img
                              src={SHIPPING_METHOD_LOGOS[method]}
                              alt={`${SHIPPING_METHOD_LABELS[method]} logó`}
                              className="max-h-3.5 w-auto object-contain"
                              loading="lazy"
                            />
                          </span>
                          <span className="leading-tight">{SHIPPING_METHOD_LABELS[method]}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-neutral-medium">
                    <span>Részösszeg</span>
                    <span className="font-medium text-neutral-dark">{formatPrice(sub)}</span>
                  </div>
                  {couponCode && discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Kupon ({couponCode})</span>
                      <span className="font-medium">−{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-neutral-medium">
                    <span>Szállítás</span>
                    <span className={cn("font-medium", hasFreeShipping && "text-emerald-600")}>
                      {hasFreeShipping ? "Ingyenes ✓" : formatPrice(ship)}
                    </span>
                  </div>
                  <div className="h-px bg-gray-100 my-1" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-neutral-dark">Összesen</span>
                    <span className="text-2xl font-extrabold text-primary tracking-tight">
                      {formatPrice(tot)}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2.5">
                  <Link
                    href="/rendeles"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-light transition-colors shadow-lg shadow-primary/20"
                  >
                    Tovább a pénztárhoz
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/kosar"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-center w-full py-3 rounded-xl bg-gray-100 text-neutral-dark font-semibold text-sm hover:bg-gray-200 transition-colors"
                  >
                    Kosár megtekintése
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
