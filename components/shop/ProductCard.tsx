"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Check, Clock, Loader2, Truck } from "lucide-react";
import {
  cn,
  formatPrice,
  calculateDiscount,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/utils";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toAnalyticsItemFromProduct, trackEvent } from "@/lib/analytics";
import { useWishlistStore } from "@/store/wishlistStore";

interface ProductCardProps {
  product: Product;
  listName?: string;
}

export function ProductCard({ product, listName = "Product Listing" }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const toggleWishlistItem = useWishlistStore((s) => s.toggleItem);
  const isWishlisted = useWishlistStore((s) => s.items.includes(product.id));
  const [imgError, setImgError] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const hasSale = !!product.salePrice;
  const discountAmount = hasSale
    ? calculateDiscount(product.price, product.salePrice!)
    : 0;
  const inStock = product.stock > 0;
  const qualifiesFreeShipping =
    (product.salePrice ?? product.price) >= FREE_SHIPPING_THRESHOLD;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    trackEvent("add_to_cart", {
      currency: "HUF",
      value: product.salePrice ?? product.price,
      items: [toAnalyticsItemFromProduct(product, { listName })],
    });
    setDrawerOpen(true);
    setShowAddedToast(true);
    setTimeout(() => setShowAddedToast(false), 1400);
  };

  const handleNavigate = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    trackEvent("select_item", {
      item_list_name: listName,
      source_path: pathname,
      items: [toAnalyticsItemFromProduct(product, { listName })],
    });
    router.push(`/termekek/${product.slug}`);
  }, [router, product, listName, pathname]);

  return (
    <div className="group">
      <a
        href={`/termekek/${product.slug}`}
        onClick={handleNavigate}
        className="relative block overflow-hidden rounded-md border border-gray-200 bg-white shadow-[8px_10px_22px_rgba(15,23,42,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[10px_14px_30px_rgba(15,23,42,0.18)]"
      >
        {showAddedToast && (
          <div className="absolute left-3 right-3 bottom-3 z-30 rounded-lg bg-neutral-dark/90 px-3 py-2 text-center text-xs font-semibold text-white backdrop-blur-sm">
            Termék a kosárba került
          </div>
        )}
        {/* Loading overlay */}
        {isNavigating && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <Loader2 className="size-6 text-neutral-dark animate-spin" />
          </div>
        )}

        {/* Image area */}
        <div className="relative aspect-square overflow-hidden bg-neutral-50">
          {product.images?.length && !imgError ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
              <span className="text-2xl text-slate-400">
                {product.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Sale badge - bottom left */}
          {hasSale && (
            <span
              className={cn(
                "absolute left-2.5 z-10 rounded-md border border-amber-300 bg-accent px-2.5 py-1 text-xs font-black uppercase tracking-wide text-black shadow-sm",
                qualifiesFreeShipping ? "bottom-10" : "bottom-2.5"
              )}
            >
              AKCIÓ!
            </span>
          )}

          {/* Free shipping badge - bottom left */}
          {qualifiesFreeShipping && (
            <span className="absolute left-2.5 bottom-2.5 z-10 inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-600 px-2.5 py-1 text-[11px] font-extrabold text-white whitespace-nowrap shadow-sm">
              <Truck className="size-3.5" strokeWidth={2.5} />
              Ingyenes szállítás
            </span>
          )}

          {/* Wishlist button - top right */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlistItem(product.id);
            }}
            className="absolute right-2.5 top-2.5 z-10 rounded-full border border-gray-200 bg-white/95 p-1.5 text-neutral-medium shadow-sm backdrop-blur-sm transition-colors hover:border-gray-300 hover:text-rose-500"
          >
            <Heart
              className={cn(
                "size-4",
                isWishlisted && "fill-rose-500 text-rose-500"
              )}
            />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Info area */}
        <div className="p-3.5">
          <h3 className="mb-2 text-[15px] md:text-base font-extrabold leading-tight tracking-tight text-neutral-dark group-hover:text-primary transition-colors break-words [overflow-wrap:anywhere] line-clamp-3 md:line-clamp-none">
            {product.name}
          </h3>

          {/* Price row + cart button */}
          <div className="border-t border-gray-100 pt-2">
            <div className="flex items-baseline gap-2 min-w-0 md:pt-0">
              {hasSale ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-black text-red-600">
                    {formatPrice(product.salePrice!)}
                  </span>
                  <span className="text-xs font-semibold text-neutral-medium line-through">
                    {formatPrice(product.price)}
                  </span>
                </div>
              ) : (
                <span className="text-xl font-black text-black">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            <div className="mt-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-0 py-0.5 text-xs font-extrabold",
                  inStock ? "text-black" : "text-neutral-dark"
                )}
              >
                {inStock ? (
                  <>
                    <span className="inline-flex size-4.5 items-center justify-center rounded-full bg-emerald-700">
                      <Check className="size-3 text-white" strokeWidth={3} />
                    </span>
                    Raktáron
                  </>
                ) : (
                  <>
                    <span className="inline-flex size-4.5 items-center justify-center rounded-full bg-brand-cyan">
                      <Clock className="size-3 text-white" strokeWidth={2.5} />
                    </span>
                    Előrendelhető
                  </>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className={cn(
                "mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-bold tracking-tight transition-all duration-200",
                inStock
                  ? "border-primary bg-primary text-white shadow-[4px_4px_0_rgba(79,0,121,0.22)] hover:bg-primary-light hover:shadow-[5px_5px_0_rgba(79,0,121,0.26)]"
                  : "border-amber-300 bg-amber-50 text-amber-800 shadow-[4px_4px_0_rgba(146,64,14,0.12)] hover:bg-amber-100"
              )}
            >
              <ShoppingCart className="size-4" />
              {inStock ? "Kosárba" : "Előrendelés"}
            </button>
          </div>
        </div>
      </a>
    </div>
  );
}
