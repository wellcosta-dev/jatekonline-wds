"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Trash2,
  Minus,
  Plus,
  ShieldCheck,
  RotateCcw,
  ShoppingBag,
  Truck,
  ArrowRight,
  Tag,
  X,
  Clock,
  Check,
  Sparkles,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { useCartStore, type CartItem } from "@/store/cartStore";
import {
  SHIPPING_METHOD_LABELS,
  SHIPPING_METHOD_LOGOS,
  type ShippingMethod,
} from "@/lib/shipping";
import { cn, formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/utils";
import { products } from "@/lib/mock-data";
import type { Product } from "@/types";
import { toAnalyticsItem, trackEvent } from "@/lib/analytics";

const SHIPPING_METHODS: ShippingMethod[] = [
  "gls",
  "gls-csomagautomata",
  "gls-csomagpont",
  "magyar-posta",
];

function getItemPrice(item: CartItem): number {
  return item.product.salePrice ?? item.product.price;
}

function getUpsellProducts(items: CartItem[]): Product[] {
  if (items.length === 0) return [];

  const cartIds = new Set(items.map((item) => item.product.id));
  const categoryCount = new Map<string, number>();
  const tagCount = new Map<string, number>();

  for (const item of items) {
    categoryCount.set(
      item.product.categoryId,
      (categoryCount.get(item.product.categoryId) ?? 0) + 1
    );
    for (const tag of item.product.tags ?? []) {
      tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
    }
  }

  const scored = products
    .filter((product) => product.isActive && !cartIds.has(product.id))
    .map((product) => {
      const categoryScore = (categoryCount.get(product.categoryId) ?? 0) * 2;
      const tagScore = (product.tags ?? []).reduce(
        (sum, tag) => sum + (tagCount.get(tag) ?? 0),
        0
      );
      const featuredScore = product.isFeatured ? 1 : 0;
      const stockScore = product.stock > 0 ? 1 : 0;
      const score = categoryScore + tagScore + featuredScore + stockScore;
      return { product, score };
    })
    .sort((a, b) => b.score - a.score || (b.product.rating ?? 0) - (a.product.rating ?? 0))
    .slice(0, 4)
    .map((entry) => entry.product);

  return scored;
}

function CartPageItem({
  item,
  onRemove,
}: {
  item: CartItem;
  onRemove: () => void;
}) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const price = getItemPrice(item);
  const lineTotal = price * item.quantity;
  const inStock = item.product.stock > 0;
  const maxQuantity = item.product.stock > 0 ? item.product.stock : 99;
  const atMax = item.quantity >= maxQuantity;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 transition-colors">
      <div className="flex gap-4">
        {/* Product image */}
        <Link
          href={`/termekek/${item.product.slug}`}
          className="relative flex-shrink-0 w-24 h-24 rounded-xl bg-gray-50 overflow-hidden"
        >
          {item.product.images?.[0] ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.product.images[0]}
              alt={item.product.name}
              className="w-full h-full object-contain p-2"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary-pale/20" />
          )}
        </Link>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/termekek/${item.product.slug}`}
                className="text-sm font-semibold text-neutral-dark hover:text-primary transition-colors line-clamp-2 leading-snug"
              >
                {item.product.name}
              </Link>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide",
                    inStock
                      ? "bg-emerald-500 text-white"
                      : "bg-brand-cyan text-white"
                  )}
                >
                  {inStock ? (
                    <><Check className="size-2.5" strokeWidth={3} /> Raktáron</>
                  ) : (
                    <><Clock className="size-2.5" strokeWidth={2.5} /> Előrendelhető</>
                  )}
                </span>
                {item.product.salePrice && (
                  <span className="text-xs text-neutral-medium line-through">
                    {formatPrice(item.product.price)}
                  </span>
                )}
                <span className="text-xs font-semibold text-neutral-dark">
                  {formatPrice(price)} / db
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="flex size-11 flex-shrink-0 items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Eltávolítás"
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          {item.variant && (item.variant.size || item.variant.color) && (
            <p className="text-xs text-neutral-medium mt-1">
              {[item.variant.size, item.variant.color].filter(Boolean).join(" • ")}
            </p>
          )}

          {/* Quantity + line total */}
          <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="mx-auto inline-flex items-center overflow-hidden rounded-xl border border-gray-200 sm:mx-0">
              <button
                type="button"
                onClick={() =>
                  updateQuantity(item.product.id, Math.max(0, item.quantity - 1), item.variant)
                }
                className="p-2.5 text-neutral-medium hover:text-primary hover:bg-primary-pale/50 transition-colors"
                aria-label="Csökkentés"
              >
                <Minus className="size-4" />
              </button>
              <input
                type="number"
                min={1}
                max={maxQuantity}
                value={item.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1) {
                    updateQuantity(item.product.id, Math.min(maxQuantity, val), item.variant);
                  }
                }}
                className="w-11 text-center text-sm font-bold text-neutral-dark bg-gray-50 border-x border-gray-200 py-2.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() =>
                  updateQuantity(item.product.id, item.quantity + 1, item.variant)
                }
                disabled={atMax}
                className="p-2.5 text-neutral-medium hover:text-primary hover:bg-primary-pale/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Növelés"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <span className="text-base font-extrabold text-neutral-dark sm:text-right">
              {formatPrice(lineTotal)}
            </span>
          </div>
          {atMax && (
            <p className="mt-2 text-[11px] font-medium text-amber-700">
              Elérted a maximum rendelhető mennyiséget ({maxQuantity} db).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KosarPage() {
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [addedUpsellId, setAddedUpsellId] = useState<string | null>(null);
  const [undoItem, setUndoItem] = useState<CartItem | null>(null);
  const viewCartTrackedRef = useRef("");
  const undoTimeoutRef = useRef<number | null>(null);

  const {
    items,
    itemCount,
    subtotal,
    shippingCost,
    total,
    couponCode,
    discount,
    applyCoupon,
    removeCoupon,
    removeItem,
    clearCart,
    addItem,
    selectedShippingMethod,
    setShippingMethod,
  } = useCartStore();

  const handleRemoveItem = (item: CartItem) => {
    removeItem(item.product.id, item.variant);
    setUndoItem(item);
    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current);
    }
    undoTimeoutRef.current = window.setTimeout(() => {
      setUndoItem(null);
      undoTimeoutRef.current = null;
    }, 5000);
  };

  const handleUndoRemove = () => {
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
  const upsellProducts = useMemo(() => getUpsellProducts(items), [items]);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        window.clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const key = `${items.map((item) => `${item.product.id}:${item.quantity}`).join("|")}|${tot}`;
    if (key === viewCartTrackedRef.current) return;
    viewCartTrackedRef.current = key;

    trackEvent("view_cart", {
      currency: "HUF",
      value: tot,
      coupon: couponCode || undefined,
      items: items.map((item) =>
        toAnalyticsItem({
          id: item.product.id,
          name: item.product.name,
          category: item.product.categoryId,
          price: item.product.salePrice ?? item.product.price,
          quantity: item.quantity,
          listName: "Cart",
        })
      ),
    });
  }, [items, tot, couponCode]);

  const handleApplyCoupon = () => {
    setCouponError(null);
    setCouponSuccess(null);
    if (!couponInput.trim()) return;
    const ok = applyCoupon(couponInput.trim());
    if (ok) {
      trackEvent("apply_coupon", {
        coupon: couponInput.trim(),
      });
      setCouponSuccess("Kupon sikeresen alkalmazva.");
      setCouponInput("");
      setTimeout(() => setCouponSuccess(null), 1600);
    } else {
      setCouponError("Érvénytelen kuponkód");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 pb-8 lg:pb-12">
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Kosár" },
          ]}
          className="mb-6"
        />

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 lg:py-32 text-center">
            <div className="size-28 rounded-3xl bg-white border border-gray-100 flex items-center justify-center mb-6 shadow-sm">
              <ShoppingBag className="size-14 text-primary/40" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-dark mb-3 tracking-tight">
              A kosarad üres
            </h1>
            <p className="text-neutral-medium max-w-md mb-8">
              Még nem adtál hozzá terméket a kosaradhoz. Böngéssz kínálatunkban
              és találd meg a tökéletes termékeket!
            </p>
            <Link
              href="/termekek"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-light transition-colors"
            >
              Vásárlás megkezdése
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left - cart items */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl lg:text-2xl font-extrabold text-neutral-dark tracking-tight">
                  Bevásárlókosár
                  <span className="ml-2 text-neutral-medium font-normal text-base">
                    ({count} termék)
                  </span>
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm("Biztosan törlöd a kosár teljes tartalmát?")) return;
                    clearCart();
                  }}
                  className="text-xs text-neutral-medium hover:text-red-500 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="size-3.5" />
                  Ürítés
                </button>
              </div>

              {/* Free shipping bar */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
                {hasFreeShipping ? (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Truck className="size-5" />
                    <span className="text-sm font-bold">Ingyenes szállítás! 🎉</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Truck className="size-4 text-primary" />
                      <span className="text-sm text-neutral-dark">
                        Még <strong className="text-primary">{formatPrice(remainingForFreeShipping)}</strong> az ingyenes szállításig
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-brand-cyan rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Cart items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <CartPageItem
                    key={`${item.product.id}-${item.variant?.size ?? ""}-${item.variant?.color ?? ""}`}
                    item={item}
                    onRemove={() => handleRemoveItem(item)}
                  />
                ))}
              </div>

              {/* Upsell */}
              {upsellProducts.length > 0 && (
                <div className="mt-6 rounded-2xl border border-gray-100 bg-white overflow-hidden">
                  <div className="px-4 sm:px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/5 via-brand-cyan/5 to-white">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="size-4 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-extrabold text-neutral-dark tracking-tight">
                          Ajánlatunk neked
                        </h2>
                        <p className="text-xs text-neutral-medium">
                          Tedd még teljesebbé a csomagodat ezekkel a termékekkel
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {upsellProducts.map((product) => {
                      const price = product.salePrice ?? product.price;
                      const justAdded = addedUpsellId === product.id;
                      return (
                        <div
                          key={product.id}
                          className="rounded-xl border border-gray-100 p-3 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <Link
                              href={`/termekek/${product.slug}`}
                              className="relative w-16 h-16 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0"
                            >
                              {product.images?.[0] ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-full h-full object-contain p-1.5"
                                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary-pale/20" />
                              )}
                            </Link>
                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/termekek/${product.slug}`}
                                className="text-xs font-bold text-neutral-dark line-clamp-2 hover:text-primary transition-colors"
                              >
                                {product.name}
                              </Link>
                              <div className="mt-1.5 flex items-center gap-2">
                                <span className="text-sm font-extrabold text-primary tracking-tight">
                                  {formatPrice(price)}
                                </span>
                                {product.salePrice && (
                                  <span className="text-[10px] text-neutral-medium line-through">
                                    {formatPrice(product.price)}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  addItem(product, 1);
                                  setAddedUpsellId(product.id);
                                  setTimeout(() => setAddedUpsellId((prev) => (prev === product.id ? null : prev)), 1400);
                                }}
                                className={cn(
                                  "mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors",
                                  justAdded
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-primary text-white hover:bg-primary-light"
                                )}
                              >
                                {justAdded ? (
                                  <>
                                    <Check className="size-3.5" />
                                    Hozzáadva
                                  </>
                                ) : (
                                  <>
                                    <Plus className="size-3.5" />
                                    Kosárba
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right - summary */}
            <div className="order-first lg:order-none lg:w-[380px] flex-shrink-0 mb-2 lg:mb-0">
              <div className="lg:sticky lg:top-36">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Summary header */}
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-base font-bold text-neutral-dark tracking-tight">
                      Rendelés összesítő
                    </h2>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Price breakdown */}
                    <div className="space-y-3 text-sm">
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
                      <div className="flex justify-between text-neutral-medium">
                        <span>Részösszeg ({count} termék)</span>
                        <span className="font-medium text-neutral-dark">{formatPrice(sub)}</span>
                      </div>
                      {couponCode && discount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Kupon ({couponCode})</span>
                          <span className="font-medium">−{formatPrice(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-neutral-medium">
                        <span>Szállítás</span>
                        <span className={cn("font-medium", hasFreeShipping && "text-emerald-600")}>
                          {hasFreeShipping ? "Ingyenes ✓" : formatPrice(ship)}
                        </span>
                      </div>
                    </div>

                    {/* Coupon */}
                    {!couponCode ? (
                      <div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-medium" />
                            <input
                              type="text"
                              value={couponInput}
                              onChange={(e) => { setCouponInput(e.target.value); setCouponError(null); }}
                              placeholder="Kuponkód"
                              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                          >
                            Alkalmaz
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-red-500 text-xs mt-1.5 pl-1">{couponError}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Tag className="size-4 text-emerald-600" />
                          <span className="text-sm font-semibold text-emerald-700">{couponCode}</span>
                          <span className="text-xs text-emerald-600">−{formatPrice(discount)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={removeCoupon}
                          className="p-1 text-emerald-400 hover:text-red-500 transition-colors"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    )}

                    {/* Total */}
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-bold text-neutral-dark">Végösszeg</span>
                        <span className="text-2xl font-extrabold text-primary tracking-tight">
                          {formatPrice(tot)}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Link
                      href="/rendeles"
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-light transition-colors shadow-lg shadow-primary/20"
                    >
                      Tovább a pénztárhoz
                      <ArrowRight className="size-4" />
                    </Link>

                    {/* Trust */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2 text-xs text-neutral-medium">
                        <ShieldCheck className="size-4 text-brand-cyan flex-shrink-0" />
                        <span>Biztonságos fizetés</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-medium">
                        <RotateCcw className="size-4 text-brand-pink flex-shrink-0" />
                        <span>30 napos visszaküldés</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {couponSuccess && (
        <div className="fixed left-4 right-4 bottom-6 z-[60] rounded-xl bg-emerald-600/95 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg backdrop-blur-sm lg:left-auto lg:right-6 lg:bottom-6 lg:w-auto">
          {couponSuccess}
        </div>
      )}
      {undoItem && (
        <div className="fixed left-4 right-4 bottom-20 z-[70] rounded-xl bg-neutral-dark/95 px-4 py-3 text-sm text-white shadow-lg backdrop-blur-sm lg:left-auto lg:right-6 lg:bottom-24 lg:w-auto">
          <div className="flex items-center justify-between gap-3">
            <span>Termék eltávolítva a kosárból.</span>
            <button
              type="button"
              onClick={handleUndoRemove}
              className="rounded-lg bg-white/10 px-2.5 py-1 font-semibold hover:bg-white/20"
            >
              Visszavonás
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
