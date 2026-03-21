"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Wallet,
  Check,
  ShieldCheck,
  Lock,
  ArrowLeft,
  Clock,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { CartItem } from "@/store/cartStore";

export type PaymentMethod = "card" | "cod";

export const COD_FEE = 990;

function getItemPrice(item: CartItem): number {
  return item.product.salePrice ?? item.product.price;
}

interface PaymentFormProps {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  onPlaceOrder: (paymentMethod: PaymentMethod) => void | Promise<void>;
  onBack?: () => void;
  isSubmitting?: boolean;
  loyaltyEnabled?: boolean;
  loyaltyLoading?: boolean;
  availableLoyaltyPoints?: number;
  loyaltyPointValue?: number;
  loyaltyPointsToUse?: number;
  maxRedeemableLoyaltyPoints?: number;
  potentialEarnedPoints?: number;
  onLoyaltyPointsChange?: (points: number) => void;
}

export function PaymentForm({
  items,
  subtotal,
  shippingCost,
  discount,
  total,
  onPlaceOrder,
  onBack,
  isSubmitting = false,
  loyaltyEnabled = false,
  loyaltyLoading = false,
  availableLoyaltyPoints = 0,
  loyaltyPointValue = 1,
  loyaltyPointsToUse = 0,
  maxRedeemableLoyaltyPoints = 0,
  potentialEarnedPoints = 0,
  onLoyaltyPointsChange,
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const handlePlaceOrder = () => {
    if (isSubmitting) return;
    if (!agreedToTerms) {
      setTermsError("A rendelés leadásához el kell fogadnod az ÁSZF-et és az adatvédelmi szabályzatot.");
      return;
    }
    setTermsError(null);
    onPlaceOrder(paymentMethod);
  };

  const canPlaceOrder = !isSubmitting && agreedToTerms;

  const displayTotal = paymentMethod === "cod" ? total + COD_FEE : total;
  const loyaltyDiscount = loyaltyPointsToUse * loyaltyPointValue;
  const inputCls =
    "w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all placeholder:text-gray-400";

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-24 lg:pb-0">
      {/* Main form */}
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-neutral-dark tracking-tight mb-4">
            Fizetési mód kiválasztása
          </h2>
          <div className="space-y-3">
            {/* Card */}
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={cn(
                "w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200",
                "hover:shadow-md",
                paymentMethod === "card"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-100 bg-white hover:border-gray-200"
              )}
            >
              <div
                className={cn(
                  "flex size-12 flex-shrink-0 items-center justify-center rounded-xl",
                  paymentMethod === "card" ? "bg-primary/10" : "bg-gray-100"
                )}
              >
                <CreditCard className={cn("size-6", paymentMethod === "card" ? "text-primary" : "text-neutral-medium")} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-neutral-dark tracking-tight">Bankkártya</p>
                <p className="text-xs text-neutral-medium mt-0.5">
                  Biztonságos online fizetés (Stripe)
                </p>
              </div>
              <div
                className={cn(
                  "size-6 flex-shrink-0 rounded-lg border-2 flex items-center justify-center transition-all",
                  paymentMethod === "card" ? "border-primary bg-primary" : "border-gray-200 bg-white"
                )}
              >
                {paymentMethod === "card" && <Check className="size-3.5 text-white" strokeWidth={3} />}
              </div>
            </button>

            {/* COD */}
            <button
              type="button"
              onClick={() => setPaymentMethod("cod")}
              className={cn(
                "w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200",
                "hover:shadow-md",
                paymentMethod === "cod"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-100 bg-white hover:border-gray-200"
              )}
            >
              <div
                className={cn(
                  "flex size-12 flex-shrink-0 items-center justify-center rounded-xl",
                  paymentMethod === "cod" ? "bg-primary/10" : "bg-gray-100"
                )}
              >
                <Wallet className={cn("size-6", paymentMethod === "cod" ? "text-primary" : "text-neutral-medium")} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-neutral-dark tracking-tight">Utánvét</p>
                <p className="text-xs text-neutral-medium mt-0.5">
                  +{formatPrice(COD_FEE)} kezelési költség
                </p>
              </div>
              <div
                className={cn(
                  "size-6 flex-shrink-0 rounded-lg border-2 flex items-center justify-center transition-all",
                  paymentMethod === "cod" ? "border-primary bg-primary" : "border-gray-200 bg-white"
                )}
              >
                {paymentMethod === "cod" && <Check className="size-3.5 text-white" strokeWidth={3} />}
              </div>
            </button>
          </div>
        </div>

        {/* Card redirect info */}
        {paymentMethod === "card" && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600">Biztonságos fizetés</span>
              </div>
              <div className="flex gap-1.5">
                <div className="h-6 w-10 rounded bg-blue-600 flex items-center justify-center text-white text-[8px] font-bold">VISA</div>
                <div className="h-6 w-10 rounded bg-red-500 flex items-center justify-center text-white text-[8px] font-bold">MC</div>
              </div>
            </div>
            <p className="text-sm text-neutral-medium leading-relaxed">
              A rendelés leadása után automatikusan átirányítunk a Stripe biztonságos fizetési oldalára,
              ahol megadhatod a bankkártya adatokat.
            </p>
          </div>
        )}

        {/* Terms */}
        {loyaltyEnabled && (
          <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-brand-cyan/5 to-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-neutral-dark">Babapont</p>
                <p className="text-xs text-neutral-medium mt-0.5">
                  Elérhető egyenleg:{" "}
                  <span className="font-bold text-primary">{availableLoyaltyPoints} pont</span>
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                <Sparkles className="size-3" />
                +{potentialEarnedPoints} pont várható
              </span>
            </div>

            {loyaltyLoading ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-neutral-medium">
                <Loader2 className="size-3.5 animate-spin" />
                Babapont egyenleg ellenőrzése...
              </div>
            ) : (
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={maxRedeemableLoyaltyPoints}
                    value={loyaltyPointsToUse}
                    disabled={maxRedeemableLoyaltyPoints === 0}
                    onChange={(e) => {
                      const value = Number(e.target.value || 0);
                      onLoyaltyPointsChange?.(Math.max(0, Math.min(value, maxRedeemableLoyaltyPoints)));
                    }}
                    className={cn(inputCls, "max-w-[150px]")}
                  />
                  <span className="text-xs text-neutral-medium">
                    = −{formatPrice(loyaltyDiscount)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[25, 50, 100].map((ratio) => {
                    const target = Math.floor((maxRedeemableLoyaltyPoints * ratio) / 100);
                    return (
                      <button
                        key={ratio}
                        type="button"
                        disabled={maxRedeemableLoyaltyPoints === 0}
                        onClick={() => onLoyaltyPointsChange?.(target)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-primary/20 text-primary hover:bg-primary/10 disabled:opacity-40"
                      >
                        {ratio}%
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => onLoyaltyPointsChange?.(0)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-gray-200 text-neutral-medium hover:bg-gray-50"
                  >
                    Törlés
                  </button>
                </div>
                {maxRedeemableLoyaltyPoints === 0 && (
                  <p className="text-[11px] text-neutral-medium">
                    Jelenleg nincs felhasználható Babapont.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <label className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:border-primary/30 transition-colors">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => {
              setAgreedToTerms(e.target.checked);
              if (e.target.checked) setTermsError(null);
            }}
            className="mt-0.5 size-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-neutral-medium leading-relaxed">
            A megrendelés leadásával elfogadom az{" "}
            <Link href="/aszf" className="text-primary font-medium hover:underline">ÁSZF</Link>
            -et és az{" "}
            <Link href="/adatvedelem" className="text-primary font-medium hover:underline">Adatvédelmi szabályzat</Link>
            ot.
          </span>
        </label>
        {termsError && (
          <p className="text-sm font-medium text-red-600 -mt-3">
            {termsError}
          </p>
        )}

        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-xs text-neutral-medium space-y-1.5">
          <p>Szállítás várhatóan 1-2 munkanap.</p>
          <p>Utánvét esetén +{formatPrice(COD_FEE)} kezelési díj kerül felszámításra.</p>
          <p>A fizetési adatok titkosított kapcsolaton keresztül kerülnek feldolgozásra.</p>
        </div>

        {/* Navigation buttons (mobile) */}
        <div className="flex gap-3 lg:hidden">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-neutral-dark hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="size-4" />
              Vissza
            </button>
          )}
        </div>
      </div>

      {/* Order summary sidebar */}
      <div className="lg:w-[360px] flex-shrink-0">
        <div className="lg:sticky lg:top-36 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-bold text-neutral-dark tracking-tight">Rendelés összesítő</h3>
            </div>

            <div className="p-5 space-y-4">
              {/* Items */}
              <div className="space-y-2.5 max-h-52 overflow-y-auto">
                {items.map((item) => {
                  const price = getItemPrice(item);
                  const lineTotal = price * item.quantity;
                  const isPreorder = item.product.stock === 0;
                  return (
                    <div
                      key={`${item.product.id}-${item.variant?.size ?? ""}-${item.variant?.color ?? ""}`}
                      className="flex gap-3 items-center"
                    >
                      <div className="flex-shrink-0 size-12 rounded-xl bg-gray-50 overflow-hidden">
                        {item.product.images?.[0] ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary-pale/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-dark truncate">{item.product.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-neutral-medium">{item.quantity}×</span>
                          {isPreorder && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-px text-[8px] font-bold rounded bg-brand-cyan text-white">
                              <Clock className="size-2" /> Előrendelés
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-neutral-dark flex-shrink-0">
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                <div className="flex justify-between text-neutral-medium">
                  <span>Részösszeg</span>
                  <span className="font-medium text-neutral-dark">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-medium">
                  <span>Szállítás</span>
                  <span className={cn("font-medium", shippingCost === 0 && "text-emerald-600")}>
                    {shippingCost === 0 ? "Ingyenes ✓" : formatPrice(shippingCost)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Kedvezmény</span>
                    <span className="font-medium">−{formatPrice(discount)}</span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Babapont levonás</span>
                    <span className="font-medium">−{formatPrice(loyaltyDiscount)}</span>
                  </div>
                )}
                {paymentMethod === "cod" && (
                  <div className="flex justify-between text-neutral-medium">
                    <span>Utánvét kezelési díj</span>
                    <span className="font-medium text-neutral-dark">{formatPrice(COD_FEE)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-neutral-dark">Végösszeg</span>
                  <span className="text-2xl font-extrabold text-primary tracking-tight">
                    {formatPrice(displayTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Place order button */}
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={!canPlaceOrder}
            className="hidden lg:flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary-light transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Rendelés feldolgozása...
              </>
            ) : (
              <>
                <Lock className="size-4" />
                {paymentMethod === "card"
                  ? `Tovább a Stripe fizetéshez – ${formatPrice(displayTotal)}`
                  : `Megrendelem – ${formatPrice(displayTotal)}`}
              </>
            )}
          </button>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-medium">
              <ShieldCheck className="size-4 text-emerald-500" />
              <span>SSL védett</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-medium">
              <Lock className="size-4 text-primary" />
              <span>Biztonságos fizetés</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky checkout CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-xs font-semibold text-neutral-medium">Végösszeg</span>
          <span className="text-lg font-extrabold text-primary tracking-tight">
            {formatPrice(displayTotal)}
          </span>
        </div>
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={!canPlaceOrder}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Rendelés feldolgozása...
            </>
          ) : (
            <>
              <Lock className="size-4" />
              {paymentMethod === "card" ? "Tovább a Stripe fizetéshez" : "Megrendelem"}
            </>
          )}
        </button>
        {!agreedToTerms && (
          <p className="mt-2 text-[11px] text-neutral-medium">
            Továbblépés előtt fogadd el a szerződési feltételeket.
          </p>
        )}
      </div>
    </div>
  );
}
