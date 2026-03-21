"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Lock,
  Clock,
  Loader2,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";
import { AddressForm, type AddressFormValues } from "@/components/checkout/AddressForm";
import { ShippingOptions } from "@/components/checkout/ShippingOptions";
import { PaymentForm, COD_FEE, type PaymentMethod } from "@/components/checkout/PaymentForm";
import { useCartStore } from "@/store/cartStore";
import {
  requiresGlsPickupPoint,
  type GlsPickupPoint,
} from "@/lib/shipping";
import {
  cn,
  formatPrice,
  FREE_SHIPPING_THRESHOLD,
  getShippingCost,
  generateOrderNumber,
} from "@/lib/utils";
import type { LoyaltySettings, Order } from "@/types";
import { createEventId, toAnalyticsItem, trackEvent } from "@/lib/analytics";

type CheckoutAttribution = {
  fbp?: string;
  fbc?: string;
  fbclid?: string;
  gclid?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPath?: string;
};

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const item = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));
  if (!item) return undefined;
  return decodeURIComponent(item.slice(name.length + 1));
}

function getItemPrice(item: { product: { salePrice?: number; price: number }; quantity: number }) {
  return (item.product.salePrice ?? item.product.price) * item.quantity;
}

export default function RendelesPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    discount,
    couponCode,
    clearCart,
    selectedShippingMethod,
    setShippingMethod,
  } = useCartStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [addressData, setAddressData] = useState<AddressFormValues | null>(null);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<GlsPickupPoint | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState(0);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>({
    enabled: true,
    earnOnDelivered: true,
    earnDivisor: 100,
    pointValueHuf: 1,
    maxRedeemPercent: 100,
  });
  const [attribution, setAttribution] = useState<CheckoutAttribution>({});
  const checkoutTrackedRef = useRef(false);

  const sub = subtotal();
  const shippingCost = getShippingCost(sub, selectedShippingMethod);
  const hasFreeShipping = sub >= FREE_SHIPPING_THRESHOLD;
  const baseTotal = sub - discount + (hasFreeShipping ? 0 : shippingCost);

  const maxRedeemablePoints = useMemo(() => {
    if (!loyaltySettings.enabled || baseTotal <= 0) return 0;
    const maxByTotal = Math.floor(baseTotal / loyaltySettings.pointValueHuf);
    const maxByPercent = Math.floor(
      (baseTotal * loyaltySettings.maxRedeemPercent) /
        100 /
        loyaltySettings.pointValueHuf
    );
    return Math.max(0, Math.min(loyaltyBalance, maxByTotal, maxByPercent));
  }, [baseTotal, loyaltyBalance, loyaltySettings]);

  const loyaltyDiscount = loyaltyPointsToUse * loyaltySettings.pointValueHuf;
  const tot = Math.max(0, baseTotal - loyaltyDiscount);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setAttribution({
      fbp: readCookie("_fbp"),
      fbc: readCookie("_fbc"),
      fbclid: params.get("fbclid") || undefined,
      gclid: params.get("gclid") || undefined,
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
      utmTerm: params.get("utm_term") || undefined,
      utmContent: params.get("utm_content") || undefined,
      landingPath: `${window.location.pathname}${window.location.search}`,
    });
  }, []);

  useEffect(() => {
    if (!addressData?.email) {
      setLoyaltyBalance(0);
      setLoyaltyPointsToUse(0);
      return;
    }
    let active = true;
    setLoyaltyLoading(true);
    fetch(`/api/loyalty/balance?email=${encodeURIComponent(addressData.email)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Loyalty load failed");
        const payload = (await response.json()) as { balance: number; settings: LoyaltySettings };
        if (!active) return;
        setLoyaltyBalance(Math.max(0, Number(payload.balance ?? 0)));
        setLoyaltySettings(payload.settings);
      })
      .catch(() => {
        if (!active) return;
        setLoyaltyBalance(0);
      })
      .finally(() => {
        if (active) setLoyaltyLoading(false);
      });

    return () => {
      active = false;
    };
  }, [addressData?.email]);

  useEffect(() => {
    setLoyaltyPointsToUse((prev) => Math.min(prev, maxRedeemablePoints));
  }, [maxRedeemablePoints]);

  useEffect(() => {
    if (!requiresGlsPickupPoint(selectedShippingMethod) && selectedPickupPoint) {
      setSelectedPickupPoint(null);
    }
    if (
      selectedShippingMethod === "gls-csomagautomata" &&
      selectedPickupPoint?.type === "parcel-shop"
    ) {
      setSelectedPickupPoint(null);
    }
    if (
      selectedShippingMethod === "gls-csomagpont" &&
      selectedPickupPoint?.type === "parcel-locker"
    ) {
      setSelectedPickupPoint(null);
    }
  }, [selectedShippingMethod, selectedPickupPoint]);

  useEffect(() => {
    if (checkoutTrackedRef.current || items.length === 0) return;
    checkoutTrackedRef.current = true;
    trackEvent("begin_checkout", {
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
          listName: "Checkout",
        })
      ),
    });
  }, [items, tot, couponCode]);

  if (items.length === 0 && !isPlacingOrder) {
    return (
      <div className="min-h-screen bg-neutral-pale">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumb
            items={[
              { label: "Főoldal", href: "/" },
              { label: "Kosár", href: "/kosar" },
              { label: "Rendelés" },
            ]}
            className="mb-6"
          />
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-24 rounded-3xl bg-white border border-gray-100 flex items-center justify-center mb-6 shadow-sm">
              <ShoppingBag className="size-12 text-primary/40" />
            </div>
            <h1 className="text-2xl font-extrabold text-neutral-dark mb-3 tracking-tight">
              A kosarad üres
            </h1>
            <p className="text-neutral-medium max-w-md mb-6">
              A rendeléshez először adj hozzá termékeket a kosaradhoz.
            </p>
            <Link
              href="/termekek"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-light transition-colors"
            >
              Vásárlás megkezdése
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleAddressSubmit = (data: AddressFormValues) => {
    setAddressData(data);
    setCheckoutError(null);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleShippingNext = () => {
    if (requiresGlsPickupPoint(selectedShippingMethod) && !selectedPickupPoint) {
      setCheckoutError("A továbblépéshez válassz GLS csomagpontot vagy csomagautomatát.");
      return;
    }
    setCheckoutError(null);
    trackEvent("add_shipping_info", {
      currency: "HUF",
      value: tot,
      coupon: couponCode || undefined,
      shipping_tier: selectedShippingMethod,
      items: items.map((item) =>
        toAnalyticsItem({
          id: item.product.id,
          name: item.product.name,
          category: item.product.categoryId,
          price: item.product.salePrice ?? item.product.price,
          quantity: item.quantity,
          listName: "Checkout",
        })
      ),
    });
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrder = async (paymentMethod: PaymentMethod) => {
    if (!addressData) return;
    if (isPlacingOrder) return;
    setCheckoutError(null);
    setIsPlacingOrder(true);

    const orderNumber = generateOrderNumber();
    const purchaseEventId = createEventId("purchase");
    const orderId = `ord-${Date.now()}`;
    const now = new Date().toISOString();
    const codFee = paymentMethod === "cod" ? COD_FEE : 0;
    const shippingAddress: Order["shippingAddress"] = {
      name: addressData.name,
      email: addressData.email,
      phone: addressData.phone,
      street: selectedPickupPoint
        ? `${selectedPickupPoint.name}, ${selectedPickupPoint.address}`
        : addressData.street,
      city: addressData.city,
      postalCode: addressData.postalCode,
      country: "Magyarország",
      company: addressData.company,
      taxNumber: addressData.taxNumber,
    };

    const billingAddress: Order["billingAddress"] = addressData.sameBillingAddress
      ? {
          ...shippingAddress,
        }
      : {
          name: addressData.billingName ?? addressData.name,
          street: addressData.billingStreet ?? addressData.street,
          city: addressData.billingCity ?? addressData.city,
          postalCode: addressData.billingPostalCode ?? addressData.postalCode,
          country: "Magyarország",
          email: addressData.email,
          phone: addressData.phone,
          company: addressData.company,
          taxNumber: addressData.taxNumber,
        };

    const order: Order = {
      id: orderId,
      orderNumber,
      guestEmail: addressData.email,
      status: "PENDING",
      items: items.map((item, index) => ({
        id: `oi-${Date.now()}-${index}`,
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.images?.[0] ?? "",
        price: item.product.salePrice ?? item.product.price,
        quantity: item.quantity,
        variant: item.variant
          ? {
              ...(item.variant.size ? { size: item.variant.size } : {}),
              ...(item.variant.color ? { color: item.variant.color } : {}),
            }
          : undefined,
      })),
      shippingAddress,
      billingAddress,
      shippingMethod: selectedShippingMethod,
      shippingPickupPoint: selectedPickupPoint
        ? {
            id: selectedPickupPoint.id,
            type: selectedPickupPoint.type,
            name: selectedPickupPoint.name,
            postalCode: selectedPickupPoint.postalCode,
            city: selectedPickupPoint.city,
            address: selectedPickupPoint.address,
          }
        : undefined,
      shippingPrice: hasFreeShipping ? 0 : shippingCost,
      subtotal: sub,
      discount,
      couponCode: couponCode || undefined,
      loyaltyPointsRedeemed: loyaltyPointsToUse,
      loyaltyDiscount,
      total: tot + codFee,
      paymentMethod,
      paymentStatus: "PENDING",
      notes: addressData.notes,
      createdAt: now,
      updatedAt: now,
    };

    trackEvent("add_payment_info", {
      currency: "HUF",
      value: order.total,
      coupon: couponCode || undefined,
      payment_type: paymentMethod,
      shipping_tier: selectedShippingMethod,
      event_id: purchaseEventId,
      items: order.items.map((item) =>
        toAnalyticsItem({
          id: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity,
          listName: "Checkout",
        })
      ),
    });

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...order,
          purchaseEventId,
          attribution,
        }),
      });
      if (!response.ok) {
        throw new Error("A rendelést nem sikerült rögzíteni.");
      }
      const created = (await response.json()) as Order;

      if (paymentMethod === "card") {
        const checkoutResponse = await fetch("/api/payments/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: created.total,
            currency: "huf",
            orderId: created.id,
            orderNumber: created.orderNumber,
            email: created.guestEmail,
            items: created.items.map((item) => ({
              name: item.productName,
              quantity: item.quantity,
              unitAmount: item.price,
            })),
          }),
        });

        if (!checkoutResponse.ok) {
          const errorPayload = (await checkoutResponse.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(errorPayload?.error || "A Stripe fizetést most nem sikerült elindítani.");
        }

        const checkoutData = (await checkoutResponse.json()) as {
          checkoutUrl?: string;
        };

        if (!checkoutData.checkoutUrl) {
          throw new Error("Hiányzik a Stripe checkout URL.");
        }

        window.location.href = checkoutData.checkoutUrl;
        return;
      }

      trackEvent("purchase", {
        transaction_id: created.orderNumber,
        value: created.total,
        currency: "HUF",
        coupon: couponCode || undefined,
        shipping: created.shippingPrice,
        event_id: purchaseEventId,
        items: created.items.map((item) =>
          toAnalyticsItem({
            id: item.productId,
            name: item.productName,
            price: item.price,
            quantity: item.quantity,
            listName: "Checkout",
          })
        ),
      });
      clearCart();
      router.push(`/rendeles/megerosites?order=${created.orderNumber}`);
    } catch (error) {
      console.error("Order placement failed:", error);
      setCheckoutError(
        error instanceof Error && error.message
          ? error.message
          : "Hiba történt a rendelés leadása közben. Kérlek próbáld újra."
      );
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Kosár", href: "/kosar" },
            { label: "Rendelés" },
          ]}
          className="mb-6"
        />

        {/* Stepper */}
        <div className="mb-8">
          <CheckoutStepper currentStep={step} />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main form area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7">
              {checkoutError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-semibold text-red-700">{checkoutError}</p>
                </div>
              )}
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="text-lg font-bold text-neutral-dark tracking-tight mb-5">
                      Szállítási adatok
                    </h2>
                    <AddressForm
                      defaultValues={addressData ?? undefined}
                      onSubmit={handleAddressSubmit}
                    />
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="text-lg font-bold text-neutral-dark tracking-tight mb-5">
                      Szállítási mód
                    </h2>
                    <ShippingOptions
                      subtotal={sub}
                      selectedMethod={selectedShippingMethod}
                      onSelect={setShippingMethod}
                      selectedPickupPoint={selectedPickupPoint}
                      onSelectPickupPoint={setSelectedPickupPoint}
                      onBack={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      onNext={handleShippingNext}
                    />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="text-lg font-bold text-neutral-dark tracking-tight mb-5">
                      Fizetés
                    </h2>
                    <PaymentForm
                      items={items}
                      subtotal={sub}
                      shippingCost={hasFreeShipping ? 0 : shippingCost}
                      discount={discount}
                      total={tot}
                      loyaltyEnabled={loyaltySettings.enabled}
                      loyaltyLoading={loyaltyLoading}
                      availableLoyaltyPoints={loyaltyBalance}
                      loyaltyPointValue={loyaltySettings.pointValueHuf}
                      loyaltyPointsToUse={loyaltyPointsToUse}
                      maxRedeemableLoyaltyPoints={maxRedeemablePoints}
                      onLoyaltyPointsChange={setLoyaltyPointsToUse}
                      potentialEarnedPoints={Math.floor(tot / loyaltySettings.earnDivisor)}
                      onPlaceOrder={handlePlaceOrder}
                      isSubmitting={isPlacingOrder}
                      onBack={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Order summary sidebar - steps 1 & 2 */}
          {step < 3 && (
            <div className="lg:w-[360px] flex-shrink-0">
              <div className="lg:sticky lg:top-36 space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-sm font-bold text-neutral-dark tracking-tight">Rendelés összesítő</h2>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Product list */}
                    <div className="space-y-2.5 max-h-56 overflow-y-auto">
                      {items.map((item) => {
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
                              <p className="text-xs font-semibold text-neutral-dark truncate">
                                {item.product.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-neutral-medium">
                                  {item.quantity} × {formatPrice(item.product.salePrice ?? item.product.price)}
                                </span>
                                {isPreorder && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-px text-[8px] font-bold rounded bg-brand-cyan text-white">
                                    <Clock className="size-2" /> Előrendelés
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-neutral-dark flex-shrink-0">
                              {formatPrice(getItemPrice(item))}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Totals */}
                    <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                      <div className="flex justify-between text-neutral-medium">
                        <span>Részösszeg</span>
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
                          {hasFreeShipping ? "Ingyenes ✓" : formatPrice(shippingCost)}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-bold text-neutral-dark">Végösszeg</span>
                        <span className="text-2xl font-extrabold text-primary tracking-tight">
                          {formatPrice(tot)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back to cart */}
                <Link
                  href="/kosar"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-100 text-neutral-dark font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="size-4" />
                  Vissza a kosárhoz
                </Link>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-medium">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    <span>Biztonságos</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-medium">
                    <Truck className="size-4 text-brand-cyan" />
                    <span>Gyors szállítás</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-medium">
                    <Lock className="size-4 text-primary" />
                    <span>SSL védett</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isPlacingOrder && (
        <div className="fixed inset-0 z-[70] bg-white/75 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5 shadow-lg flex items-center gap-3">
            <Loader2 className="size-5 text-primary animate-spin" />
            <div>
              <p className="text-sm font-bold text-neutral-dark tracking-tight">Rendelés feldolgozása</p>
              <p className="text-xs text-neutral-medium">Kérlek várj, ne zárd be az oldalt.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
