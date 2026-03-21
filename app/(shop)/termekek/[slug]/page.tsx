"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingBag,
  Minus,
  Plus,
  Truck,
  Package,
  RotateCcw,
  ShieldCheck,
  Check,
  Clock,
  Star,
  LoaderCircle,
  PencilLine,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { RecommendedProducts } from "@/components/shop/RecommendedProducts";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { cn, formatPrice, FREE_SHIPPING_THRESHOLD, getShippingCost } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { categories } from "@/lib/mock-data";
import { absoluteUrl } from "@/lib/seo";
import { getProductInternalLinks, getSeoProductLead } from "@/lib/seo-product-copy";
import { toAnalyticsItemFromProduct, trackEvent } from "@/lib/analytics";
import { MERCHANT_RETURN_DAYS } from "@/lib/merchant-policy";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";
import type { Product } from "@/types";

const TABS = [
  { id: "leiras", label: "Leírás" },
  { id: "spec", label: "Specifikációk" },
  { id: "velemenyek", label: "Vélemények" },
] as const;

const SHIPPING_OPTIONS = [
  {
    key: "gls",
    label: "GLS Házhozszállítás",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a6/GLS_Logo_2021.svg",
  },
  {
    key: "gls-csomagautomata",
    label: "GLS Csomagautomata",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a6/GLS_Logo_2021.svg",
  },
  {
    key: "gls-csomagpont",
    label: "GLS Csomagpont",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a6/GLS_Logo_2021.svg",
  },
  {
    key: "magyar-posta",
    label: "MPL (Magyar Posta)",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/69/Magyar_Posta_logo.svg",
  },
] as const;

type ProductReview = {
  id: string;
  authorName: string;
  rating: number;
  content: string;
  createdAt: string;
};

type ReviewResponse = {
  reviews?: ProductReview[];
  error?: string;
  message?: string;
};

function parsePromotionTimestamp(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getCountdownParts(remainingMs: number) {
  const safeMs = Math.max(0, remainingMs);
  const totalSeconds = Math.floor(safeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "size-6" : size === "md" ? "size-5" : "size-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200"
          )}
        />
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("leiras");
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [isCategoryNavigating, setIsCategoryNavigating] = useState(false);
  const [approvedReviews, setApprovedReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitError, setReviewSubmitError] = useState<string | null>(null);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdminSession, setIsAdminSession] = useState(false);
  const [highlightWarranty, setHighlightWarranty] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const warrantyRef = useRef<HTMLElement | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);

  useEffect(() => {
    let active = true;
    setProductLoading(true);
    fetch(`/api/products/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!active) return;
        if (!response.ok) throw new Error(payload?.error ?? "A termék nem található.");
        setProduct(payload as Product);
      })
      .catch(() => {
        if (active) setProduct(null);
      })
      .finally(() => {
        if (active) setProductLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!product) return;
    let active = true;
    setReviewsLoading(true);
    fetch(`/api/reviews?productId=${encodeURIComponent(product.id)}`, { cache: "no-store" })
      .then((response) => response.json().then((payload: ReviewResponse) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!active) return;
        if (!response.ok) {
          throw new Error(payload.error ?? "Nem sikerült a vélemények betöltése.");
        }
        setApprovedReviews(payload.reviews ?? []);
      })
      .catch(() => {
        if (active) setApprovedReviews([]);
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [product?.id, product]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) =>
        response
          .json()
          .then((payload: { user?: { role?: "ADMIN" | "CUSTOMER" } }) => ({ response, payload }))
          .catch(() => ({ response, payload: undefined as { user?: { role?: "ADMIN" | "CUSTOMER" } } | undefined }))
      )
      .then(({ response, payload }) => {
        if (!active) return;
        setIsAuthenticated(response.ok);
        setIsAdminSession(Boolean(response.ok && payload?.user?.role === "ADMIN"));
      })
      .catch(() => {
        if (active) {
          setIsAuthenticated(false);
          setIsAdminSession(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!product) return;
    trackEvent("view_item", {
      currency: "HUF",
      value: product.salePrice ?? product.price,
      items: [toAnalyticsItemFromProduct(product, { listName: "Product Detail" })],
    });
  }, [product]);

  useEffect(() => {
    if (!product?.salePrice || !Array.isArray(product.promotions) || product.promotions.length === 0) {
      return;
    }
    const hasTimedPromotion = product.promotions.some((promotion) => Boolean(promotion.endAt));
    if (!hasTimedPromotion) return;
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [product?.id, product?.salePrice, product?.promotions]);

  if (productLoading) {
    return (
      <div className="container mx-auto px-4 py-16 md:py-24 text-center text-neutral-medium">
        Termék betöltése...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="font-bold text-2xl md:text-3xl text-neutral-dark mb-4">
          Termék nem található
        </h1>
        <p className="text-neutral-medium mb-6">
          A keresett termék nem létezik vagy már nem elérhető.
        </p>
        <Link
          href="/termekek"
          className="btn-primary inline-flex items-center gap-2"
        >
          Vissza a termékekhez
        </Link>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const safeDescriptionHtml = sanitizeRichHtml(product.description);
  const hasSale = !!product.salePrice;
  const displayPrice = product.salePrice ?? product.price;
  const savings = hasSale ? product.price - product.salePrice! : 0;
  const inStock = product.stock > 0;
  const maxQuantity = product.stock > 0 ? product.stock : 99;
  const totalReviewCount = approvedReviews.length;
  const calculatedRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum, item) => sum + item.rating, 0) / approvedReviews.length
      : 0;
  const isFreeShippingEligible = displayPrice >= FREE_SHIPPING_THRESHOLD;
  const estimatedLoyaltyPoints = Math.max(0, Math.floor(displayPrice / 100));
  const estimatedDeliveryLabel = inStock ? "1-2 munkanap" : "4-5 munkanap";
  const activeSalePromotion = (() => {
    if (!hasSale || !Array.isArray(product.promotions) || product.promotions.length === 0) {
      return undefined;
    }
    const matchingPromotions = product.promotions.filter((promotion) => {
      const salePrice = Number(promotion.salePrice ?? 0);
      if (!Number.isFinite(salePrice) || salePrice <= 0) return false;
      if (salePrice !== displayPrice) return false;
      const startAt = parsePromotionTimestamp(promotion.startAt);
      const endAt = parsePromotionTimestamp(promotion.endAt);
      if (startAt !== undefined && startAt > nowMs) return false;
      if (endAt !== undefined && endAt < nowMs) return false;
      return true;
    });
    if (matchingPromotions.length === 0) return undefined;
    return [...matchingPromotions].sort((a, b) => {
      const aEnd = parsePromotionTimestamp(a.endAt) ?? Number.MAX_SAFE_INTEGER;
      const bEnd = parsePromotionTimestamp(b.endAt) ?? Number.MAX_SAFE_INTEGER;
      return aEnd - bEnd;
    })[0];
  })();
  const saleEndsAtMs = parsePromotionTimestamp(activeSalePromotion?.endAt);
  const hasLiveCountdown = Boolean(saleEndsAtMs && saleEndsAtMs > nowMs);
  const countdown = hasLiveCountdown && saleEndsAtMs ? getCountdownParts(saleEndsAtMs - nowMs) : null;
  const saleEndsAtLabel = activeSalePromotion?.endAt
    ? new Date(activeSalePromotion.endAt).toLocaleString("hu-HU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const productSeoLead = getSeoProductLead(product, category?.name);
  const productInternalLinks = getProductInternalLinks(product, category?.slug);

  const breadcrumbItems = [
    { label: "Főoldal", href: "/" },
    { label: "Termékek", href: "/termekek" },
    ...(category
      ? [{ label: category.name, href: `/kategoriak/${category.slug}` }]
      : []),
    { label: product.name },
  ];

  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.shortDesc ?? product.description,
    image: (product.images ?? []).slice(0, 5).map((image) => absoluteUrl(image)),
    brand: {
      "@type": "Brand",
      name: product.manufacturer || "FreeOn",
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/termekek/${product.slug}`),
      priceCurrency: "HUF",
      price: displayPrice,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: isFreeShippingEligible
        ? {
            "@type": "OfferShippingDetails",
            shippingRate: {
              "@type": "MonetaryAmount",
              value: 0,
              currency: "HUF",
            },
            shippingDestination: {
              "@type": "DefinedRegion",
              addressCountry: "HU",
            },
          }
        : undefined,
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "HU",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: MERCHANT_RETURN_DAYS,
        returnMethod: "https://schema.org/ReturnByMail",
      },
    },
    aggregateRating:
      totalReviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(calculatedRating.toFixed(1)),
            reviewCount: totalReviewCount,
          }
        : undefined,
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href ?? `/termekek/${product.slug}`),
    })),
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
    trackEvent("add_to_cart", {
      currency: "HUF",
      value: (product.salePrice ?? product.price) * quantity,
      items: [toAnalyticsItemFromProduct(product, { quantity, listName: "Product Detail" })],
    });
    setDrawerOpen(true);
    setShowAddedToast(true);
    setTimeout(() => setShowAddedToast(false), 1400);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    trackEvent("add_to_cart", {
      currency: "HUF",
      value: (product.salePrice ?? product.price) * quantity,
      items: [toAnalyticsItemFromProduct(product, { quantity, listName: "Product Detail Buy Now" })],
    });
    setDrawerOpen(false);
    router.push("/rendeles");
  };

  const handleCategoryNavigation = (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    if (isCategoryNavigating) return;
    setIsCategoryNavigating(true);

    // Tiny delay so users see immediate feedback before route transition.
    window.setTimeout(() => {
      router.push(href);
    }, 160);
  };

  const handleWarrantyJump = () => {
    setHighlightWarranty(true);
    window.setTimeout(() => setHighlightWarranty(false), 1400);
    warrantyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmitReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReviewSubmitError(null);
    setReviewSubmitSuccess(null);
    const author = reviewAuthor.trim();
    const content = reviewText.trim();
    if (!author || content.length < 8) return;

    fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        authorName: author,
        rating: reviewRating,
        content,
      }),
    })
      .then((response) => response.json().then((payload: ReviewResponse) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!response.ok) {
          throw new Error(payload.error ?? "Nem sikerült beküldeni a véleményt.");
        }
        setReviewAuthor("");
        setReviewText("");
        setReviewRating(5);
        setReviewSubmitSuccess(
          payload.message ?? "Köszönjük az értékelésed. Egy adminisztrátor hamarosan jóváhagyja."
        );
      })
      .catch((error) => {
        setReviewSubmitError(error instanceof Error ? error.message : "Nem sikerült beküldeni a véleményt.");
      });
  };

  return (
    <>
      <div className="container mx-auto px-4 py-6 md:py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
        />
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-8 lg:gap-10 mb-16 items-start">
          {/* LEFT: Gallery */}
          <div className="flex flex-col items-center lg:items-start lg:sticky lg:top-24 self-start">
            <ProductGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* RIGHT: Product info */}
          <div className="space-y-5 relative group/product-info">
            {category && (
              <Link
                href={`/kategoriak/${category.slug}`}
                onClick={handleCategoryNavigation(`/kategoriak/${category.slug}`)}
                aria-busy={isCategoryNavigating}
                className={cn(
                  "inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary bg-primary-pale/60 px-3 py-1 rounded-full transition-colors",
                  isCategoryNavigating
                    ? "pointer-events-none bg-primary-pale animate-pulse"
                    : "hover:bg-primary-pale"
                )}
              >
                {isCategoryNavigating && (
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                )}
                {isCategoryNavigating ? "Betöltés..." : category.name}
              </Link>
            )}

            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-dark tracking-tight leading-tight pr-0 lg:pr-36">
              {product.name}
            </h1>
            {isAdminSession ? (
              <a
                href={`/admin/termekek/${product.id}`}
                target="_blank"
                rel="noreferrer"
                className="hidden lg:inline-flex absolute right-0 top-0 items-center gap-2 rounded-full border border-violet-200 bg-white/95 px-4 py-2 text-xs font-bold text-violet-700 shadow-sm backdrop-blur transition-all duration-200 opacity-0 translate-y-1 group-hover/product-info:opacity-100 group-hover/product-info:translate-y-0 hover:bg-violet-50 hover:border-violet-300"
              >
                <PencilLine className="size-3.5" />
                Termék szerkesztése
              </a>
            ) : null}

            {/* Rating */}
            {totalReviewCount > 0 && (
              <div className="flex items-center gap-3">
                <StarRating rating={calculatedRating} size="md" />
                <a
                  href="#velemenyek"
                  onClick={() => setActiveTab("velemenyek")}
                  className="text-sm text-neutral-medium hover:text-primary transition-colors"
                >
                  {totalReviewCount} vélemény
                </a>
              </div>
            )}

            {/* Price block */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
              <Star className="size-4 text-primary" />
              <p className="text-sm font-semibold text-neutral-dark">
                <span className="text-neutral-medium">Babapont jutalom:</span>{" "}
                <span className="font-extrabold text-primary">+{estimatedLoyaltyPoints} pont</span>
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <span className="text-3xl font-extrabold text-primary tracking-tight">
                {formatPrice(displayPrice)}
              </span>
              {hasSale && (
                <>
                  <span className="text-lg text-neutral-medium line-through">
                    {formatPrice(product.price)}
                  </span>
                  <span className="px-2.5 py-1 text-sm font-bold rounded-md text-neutral-dark bg-accent">
                    -{Math.round((savings / product.price) * 100)}%
                  </span>
                </>
              )}
            </div>
            {hasSale && (saleEndsAtLabel || hasLiveCountdown) && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-sky-50 to-white px-3 py-3 sm:px-4"
              >
                <div className="flex flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="w-full sm:w-auto">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary/80">
                      Kedvezmény vége
                    </p>
                    <p className="text-sm font-semibold leading-tight text-neutral-dark">
                      {saleEndsAtLabel ? `${saleEndsAtLabel}-ig` : "Hamarosan véget ér"}
                    </p>
                  </div>
                  {countdown && (
                    <div className="grid w-full grid-cols-4 gap-1.5 sm:flex sm:w-auto sm:items-center">
                      {[
                        { label: "nap", value: countdown.days },
                        { label: "óra", value: countdown.hours },
                        { label: "perc", value: countdown.minutes },
                        { label: "mp", value: countdown.seconds },
                      ].map((part) => (
                        <div
                          key={part.label}
                          className="rounded-xl border border-primary/15 bg-white px-2 py-1.5 text-center shadow-sm sm:min-w-[52px]"
                        >
                          <div className="text-sm font-extrabold text-primary tabular-nums">
                            {String(part.value).padStart(2, "0")}
                          </div>
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-medium">
                            {part.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            {isAdminSession && Number.isFinite(product.purchasePrice) && Number(product.purchasePrice) > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold">
                {(() => {
                  const purchasePrice = Number(product.purchasePrice);
                  const profitFt = displayPrice - purchasePrice;
                  const marginPercent = displayPrice > 0 ? (profitFt / displayPrice) * 100 : 0;
                  const lowMargin = marginPercent < 8;
                  return (
                    <span className={lowMargin ? "text-red-700" : "text-violet-700"}>
                      {marginPercent.toFixed(1)}% Haszon: {formatPrice(Math.round(profitFt))}
                    </span>
                  );
                })()}
              </div>
            ) : null}

            {/* Stock badge */}
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2.5">
                {inStock ? (
                  <>
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-700">
                      <Check className="size-3.5 text-white" strokeWidth={3} />
                    </span>
                    <span className="text-base font-extrabold text-black">Raktáron</span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-brand-cyan">
                      <Clock className="size-3 text-white" strokeWidth={2.5} />
                    </span>
                    <span className="text-base font-extrabold text-neutral-dark">Előrendelhető</span>
                  </>
                )}
              </span>
              <p className="text-sm text-neutral-dark">
                <span className="font-bold">Várható szállítási idő:</span>{" "}
                <span className="font-semibold">{estimatedDeliveryLabel}</span>
              </p>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-pale/60 px-4 py-1.5 text-sm font-extrabold text-neutral-dark">
                <RotateCcw className="size-4 text-primary" />
                30 napos visszaküldés
              </span>
            </div>

            {/* Quantity + Add to cart */}
            <div className="flex gap-3 items-center pt-2 flex-wrap">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3.5 hover:bg-gray-50 transition-colors text-neutral-dark disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="size-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) setQuantity(Math.max(1, Math.min(maxQuantity, v)));
                  }}
                  className="w-14 text-center font-semibold border-x border-gray-200 py-3.5 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(maxQuantity, q + 1))
                  }
                  disabled={quantity >= maxQuantity}
                  className="p-3.5 hover:bg-gray-50 transition-colors text-neutral-dark"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className={cn(
                  "flex-1 flex min-h-11 items-center justify-center gap-2 py-3.5 text-base font-bold rounded-xl text-white transition-colors",
                  inStock
                    ? "bg-primary hover:bg-primary-light"
                    : "bg-brand-cyan hover:bg-brand-cyan/80"
                )}
              >
                <ShoppingBag className="size-5" />
                {inStock ? "Kosárba teszem" : "Előrendelés"}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full sm:w-auto min-h-11 px-5 py-3.5 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary hover:text-white transition-colors"
              >
                {inStock ? "Megveszem most" : "Előrendelem most"}
              </button>
            </div>

            <div className="rounded-2xl border border-primary/15 bg-primary-pale/20 p-4">
              <p className="text-sm font-bold text-neutral-dark mb-3">Szállítási módok</p>
              <div className="space-y-2.5">
                {SHIPPING_OPTIONS.map((option) => {
                  const shippingFee = isFreeShippingEligible
                    ? "Ingyenes"
                    : formatPrice(getShippingCost(displayPrice, option.key));

                  return (
                    <div
                      key={option.key}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200/80 bg-white px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="inline-flex h-8 w-16 items-center justify-center rounded-lg border border-gray-100 bg-white px-1">
                          <img
                            src={option.logoUrl}
                            alt={`${option.label} logó`}
                            className="max-h-5 w-auto object-contain"
                            loading="lazy"
                          />
                        </span>
                        <span className="text-sm font-semibold text-neutral-dark truncate">
                          {option.label}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-bold whitespace-nowrap",
                          shippingFee === "Ingyenes" ? "text-emerald-600" : "text-neutral-dark"
                        )}
                      >
                        {shippingFee}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-neutral-medium">
                {formatPrice(FREE_SHIPPING_THRESHOLD)} felett minden szállítási mód ingyenes.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl border border-gray-200/80 bg-gray-50/80 p-3 sm:grid-cols-3 sm:gap-3 sm:p-3.5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-medium">Gyártó</p>
                  <p className="mt-0.5 text-sm font-semibold text-neutral-dark">
                    {product.manufacturer?.trim() || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-medium">Cikkszám</p>
                  <p className="mt-0.5 text-sm font-semibold text-neutral-dark">{product.sku || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-medium">EAN</p>
                  <p className="mt-0.5 text-sm font-semibold text-neutral-dark">{product.ean?.trim() || "-"}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pb-2">
              <WishlistButton productId={product.id} size="lg" />
              <span className="text-sm text-neutral-medium">Kívánságlistára</span>
            </div>
            <div className="pb-2">
              <button
                type="button"
                onClick={handleWarrantyJump}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                Szállítási és jótállási információk
              </button>
            </div>

            {/* Benefits cards */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="group flex items-center gap-3 bg-brand-cyan/10 border border-brand-cyan/20 rounded-2xl px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="size-11 rounded-xl bg-brand-cyan/20 flex items-center justify-center flex-shrink-0 transition group-hover:scale-105 group-hover:rotate-3">
                  <Truck className="size-5 text-brand-cyan transition group-hover:-translate-y-0.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-dark">Ingyenes szállítás</p>
                  <p className="text-xs text-neutral-medium">{formatPrice(FREE_SHIPPING_THRESHOLD)} felett</p>
                </div>
              </div>
              <div className="group flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="size-11 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 transition group-hover:scale-105 group-hover:rotate-3">
                  <RotateCcw className="size-5 text-primary transition group-hover:-translate-y-0.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-dark">30 napos visszaküldés</p>
                  <p className="text-xs text-neutral-medium">Kérdés nélkül</p>
                </div>
              </div>
              <div className="group flex items-center gap-3 bg-brand-pink/10 border border-brand-pink/20 rounded-2xl px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="size-11 rounded-xl bg-brand-pink/20 flex items-center justify-center flex-shrink-0 transition group-hover:scale-105 group-hover:rotate-3">
                  <Package className="size-5 text-brand-pink transition group-hover:-translate-y-0.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-dark">1-2 napos kiszállítás</p>
                  <p className="text-xs text-neutral-medium">Gyors feldolgozás</p>
                </div>
              </div>
              <div className="group flex items-center gap-3 bg-accent/10 border border-accent/20 rounded-2xl px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="size-11 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0 transition group-hover:scale-105 group-hover:rotate-3">
                  <ShieldCheck className="size-5 text-accent transition group-hover:-translate-y-0.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-dark">Biztonságos fizetés</p>
                  <p className="text-xs text-neutral-medium">SSL titkosítás</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Tabs */}
        <div className="mb-16" id="velemenyek">
          {/* Tab buttons */}
          <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 text-neutral-dark/70 hover:bg-gray-200 hover:text-neutral-dark"
                )}
              >
                {tab.id === "velemenyek"
                  ? `Vélemények (${totalReviewCount})`
                  : tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            {activeTab === "leiras" && (
              <div>
                <p className="mb-4 rounded-xl border border-primary/20 bg-primary-pale/40 px-4 py-3 text-sm font-semibold text-neutral-dark">
                  {productSeoLead}
                </p>
                <div
                  className="text-neutral-dark leading-relaxed text-[15px] prose prose-sm max-w-none prose-p:my-2 prose-li:my-1"
                  dangerouslySetInnerHTML={{ __html: safeDescriptionHtml }}
                />
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="text-sm font-bold text-neutral-dark mb-2">Kapcsolódó oldalak</p>
                  <div className="flex flex-wrap gap-2">
                    {productInternalLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-dark hover:border-primary hover:text-primary transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "spec" && (
              <div className="grid gap-0 divide-y divide-gray-100">
                <div className="grid grid-cols-[140px_1fr] md:grid-cols-[200px_1fr] py-3.5">
                  <span className="text-sm font-semibold text-neutral-medium">Cikkszám</span>
                  <span className="text-sm text-neutral-dark">{product.sku}</span>
                </div>
                {product.weight != null && (
                  <div className="grid grid-cols-[140px_1fr] md:grid-cols-[200px_1fr] py-3.5">
                    <span className="text-sm font-semibold text-neutral-medium">Súly</span>
                    <span className="text-sm text-neutral-dark">{product.weight} kg</span>
                  </div>
                )}
                {category && (
                  <div className="grid grid-cols-[140px_1fr] md:grid-cols-[200px_1fr] py-3.5">
                    <span className="text-sm font-semibold text-neutral-medium">Kategória</span>
                    <span className="text-sm text-neutral-dark">{category.name}</span>
                  </div>
                )}
                {product.tags.length > 0 && (
                  <div className="grid grid-cols-[140px_1fr] md:grid-cols-[200px_1fr] py-3.5">
                    <span className="text-sm font-semibold text-neutral-medium">Címkék</span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-0.5 bg-primary-pale/60 text-primary text-xs font-medium rounded-full"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "velemenyek" && (
              <div className="space-y-5">
                {/* Summary */}
                <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
                  <div className="text-center">
                    {totalReviewCount > 0 ? (
                      <>
                        <div className="text-4xl font-extrabold text-neutral-dark tracking-tight">
                          {calculatedRating.toFixed(1)}
                        </div>
                        <StarRating rating={calculatedRating} size="sm" />
                      </>
                    ) : (
                      <div className="text-sm font-bold text-neutral-medium">Még nincs értékelés</div>
                    )}
                    <p className="text-xs text-neutral-medium mt-1">{totalReviewCount} vélemény</p>
                  </div>
                </div>

                {isAuthenticated === false ? (
                  <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary-pale/60 to-white p-4">
                    <p className="text-sm font-bold text-neutral-dark">Véleményíráshoz bejelentkezés szükséges.</p>
                    <p className="mt-1 text-xs text-neutral-medium">
                      Így biztosítjuk, hogy valós vásárlói visszajelzések jelenjenek meg.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Link href="/bejelentkezes" className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-light">
                        Bejelentkezés
                      </Link>
                      <Link href="/regisztracio" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-neutral-dark hover:bg-gray-50">
                        Regisztráció
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                    <p className="text-sm font-bold text-neutral-dark">Írj véleményt</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={reviewAuthor}
                        onChange={(event) => setReviewAuthor(event.target.value)}
                        placeholder="Név"
                        required
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <select
                        value={reviewRating}
                        onChange={(event) => setReviewRating(Number(event.target.value))}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {[5, 4, 3, 2, 1].map((value) => (
                          <option key={value} value={value}>{value} csillag</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={reviewText}
                      onChange={(event) => setReviewText(event.target.value)}
                      placeholder="Tapasztalatod a termékkel..."
                      required
                      minLength={8}
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-light transition-colors"
                    >
                      Vélemény küldése
                    </button>
                    {reviewSubmitError && (
                      <p className="text-xs font-semibold text-red-600">{reviewSubmitError}</p>
                    )}
                    <AnimatePresence>
                      {reviewSubmitSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                        >
                          {reviewSubmitSuccess}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                )}
                {reviewsLoading ? (
                  <p className="text-sm text-neutral-medium">Vélemények betöltése...</p>
                ) : approvedReviews.length === 0 ? (
                  <p className="text-sm text-neutral-medium">
                    Még nincs jóváhagyott vélemény ennél a terméknél.
                  </p>
                ) : (
                  approvedReviews.map((review) => {
                    const avatar = review.authorName.slice(0, 2).toUpperCase();
                    const dateLabel = new Date(review.createdAt).toLocaleDateString("hu-HU");
                    return (
                      <div
                        key={review.id}
                        className="flex gap-4 py-4 border-b border-gray-50 last:border-0"
                      >
                        <div className="size-10 rounded-full bg-primary-pale flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">{avatar}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-neutral-dark">
                              {review.authorName}
                            </span>
                            <span className="text-xs text-neutral-medium">
                              {dateLabel}
                            </span>
                          </div>
                          <StarRating rating={review.rating} size="sm" />
                          <p className="text-sm text-neutral-dark mt-2 leading-relaxed">{review.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        <section
          id="szallitasi-ido-jotallas"
          ref={warrantyRef}
          className={cn(
            "mb-12 rounded-2xl border border-gray-200 bg-white p-5 md:p-6 transition-all duration-500",
            highlightWarranty && "ring-2 ring-primary/40 shadow-lg shadow-primary/10"
          )}
        >
          <h2 className="text-xl font-extrabold tracking-tight text-neutral-dark mb-4">
            Jótállási idő
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-neutral-dark">
            <p>
              A kötelező (jogszabály által előírt) jótállás feltételei a jótállási időt
              sávosan, a tartós fogyasztási cikk bruttó eladási árához igazodva határozza
              meg. (Weboldalunkon bruttó eladási árat tüntettük fel.)
            </p>
            <p className="font-bold">A kötelező jótállás időtartama:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                10 000 forintot elérő, de 250 000 forintot meg nem haladó eladási ár esetén
                2 év,
              </li>
              <li>250 000 forint eladási ár felett 3 év.</li>
            </ul>
            <p>
              A jogszabály által előírt kötelező jótállási időn felül a gyártó önkéntes
              jótállást is vállalhat, melyet akár többletfeltételhez is köthet. Kérjük, az
              önkéntes jótállás feltételeiről minden esetben körültekintően tájékozódjanak a
              gyártó elérhetőségein! (270/2020. (VI. 12.) Korm. rendelet)
            </p>
            <p>
              Valamint tájékoztatásul közöljük, hogy a 2021. január 1-től hatályos rendelet
              csak a fogyasztó és vállalkozás közötti szerződés keretében eladott, a rendelet
              mellékletében felsorolt új tartós fogyasztási cikkekre írja elő a kötelező
              jótállás szabályait.
            </p>
            <p>
              Fogyasztó lehet természetes személy, vagy mikro-, kis- és középvállalkozás.
              Másik kitétel, hogy csak akkor minősül fogyasztónak egy személy/cég, ha a
              szakmája, önálló foglalkozása vagy üzleti tevékenysége körén kívül köt
              szerződést.
            </p>
            <p>
              Fontos információ! Az oldalunkon található termékleírásokat és specifikációkat a
              lehető legnagyobb gondossággal töltjük fel, azonban előfordulhatnak bennük
              pontatlanságok vagy elírások. Amennyiben egy adott termékkel kapcsolatban
              részletesebb vagy speciális információra van szükséged, javasoljuk, hogy keresd
              fel a gyártó hivatalos weboldalát, vagy lépj kapcsolatba ügyfélszolgálatunkkal,
              ahol készséggel állunk rendelkezésedre.
            </p>
          </div>
        </section>

        {/* Recommended products */}
        {product.categoryId && (
          <RecommendedProducts
            currentProductId={product.id}
            categoryId={product.categoryId}
          />
        )}
      </div>

      {showAddedToast && (
        <div className="fixed left-4 right-4 bottom-24 md:bottom-6 z-[60] rounded-xl bg-neutral-dark/90 px-4 py-3 text-center text-sm font-semibold text-white backdrop-blur-sm md:left-auto md:right-6 md:w-auto">
          A termék a kosárba került
        </div>
      )}

      {/* Sticky add to cart bar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 md:hidden",
          showStickyBar ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Product info */}
              <div className="flex-1 min-w-0 hidden sm:block">
                <h3 className="text-sm font-bold text-neutral-dark truncate">{product.name}</h3>
                <span className="text-lg font-extrabold text-primary">{formatPrice(displayPrice)}</span>
              </div>
              {/* Mobile: just price */}
              <div className="flex-1 min-w-0 sm:hidden">
                <span className="text-lg font-extrabold text-primary">{formatPrice(displayPrice)}</span>
              </div>

              {/* Quantity */}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 hover:bg-gray-50 transition-colors"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                  disabled={quantity >= maxQuantity}
                  className="p-2.5 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              {/* Add to cart button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className={cn(
                  "flex min-h-11 items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-colors",
                  inStock
                    ? "bg-primary hover:bg-primary-light"
                    : "bg-brand-cyan hover:bg-brand-cyan/80"
                )}
              >
                <ShoppingBag className="size-4" />
                {inStock ? "Kosárba teszem" : "Előrendelés"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
