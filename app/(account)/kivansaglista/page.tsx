"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { products } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import { useEffect, useMemo, useState } from "react";

export default function KivansaglistaPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const wishlistIds = useWishlistStore((s) => s.items);
  const setWishlistItems = useWishlistStore((s) => s.setItems);
  const removeWishlistItem = useWishlistStore((s) => s.removeItem);
  const addToCart = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.setDrawerOpen);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    let active = true;
    fetch("/api/account/profile", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!active) return;
        if (!response.ok) {
          setIsAuthenticated(false);
          return;
        }
        setIsAuthenticated(true);
        const wishlist = (payload.user?.wishlist ?? []) as string[];
        if (Array.isArray(wishlist)) {
          setWishlistItems(wishlist);
        }
      })
      .catch(() => {
        if (active) setIsAuthenticated(false);
      });
    return () => {
      active = false;
    };
  }, [isHydrated, setWishlistItems]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;
    const timeout = window.setTimeout(() => {
      fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "wishlist", wishlist: wishlistIds }),
      }).catch(() => undefined);
    }, 400);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [wishlistIds, isHydrated, isAuthenticated]);

  const wishlistProducts = useMemo(
    () => products.filter((product) => wishlistIds.includes(product.id)),
    [wishlistIds]
  );

  if (!isHydrated) {
    return (
      <div className="card p-12 text-center">
        <p className="text-neutral-medium">Kívánságlista betöltése...</p>
      </div>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-primary-pale flex items-center justify-center mx-auto mb-6">
          <Heart className="size-10 text-primary" />
        </div>
        <h1 className="font-extrabold text-2xl tracking-tight text-neutral-dark mb-2">
          Kívánságlista
        </h1>
        <p className="text-neutral-medium mb-6 max-w-md mx-auto">
          A kívánságlistád jelenleg üres. Böngéssz a termékeink között és add hozzá
          a kedvenceidet!
        </p>
        <Link href="/termekek" className="btn-primary">
          Termékek böngészése
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-extrabold text-2xl tracking-tight text-neutral-dark">
          Kívánságlista
        </h1>
        <span className="text-sm text-neutral-medium">
          {wishlistProducts.length} termék
        </span>
      </div>

      <div className="card p-4 md:p-5">
        <div className="space-y-3">
          {wishlistProducts.map((product) => (
            <div
              key={product.id}
              className="rounded-xl border border-gray-200 p-3 md:p-4 flex flex-col sm:flex-row gap-3"
            >
              <Link
                href={`/termekek/${product.slug}`}
                className="relative h-24 w-full sm:w-24 rounded-lg overflow-hidden bg-neutral-pale shrink-0"
              >
                <Image
                  src={product.images?.[0] ?? "/babyonline-logo.png"}
                  alt={product.name}
                  fill
                  className="object-contain p-1.5"
                  sizes="96px"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/termekek/${product.slug}`}
                  className="text-sm md:text-base font-semibold text-neutral-dark hover:text-primary line-clamp-2"
                >
                  {product.name}
                </Link>
                <p className="mt-1 text-lg font-extrabold text-primary">
                  {formatPrice(product.salePrice ?? product.price)}
                </p>
                {product.salePrice && (
                  <p className="text-xs text-neutral-medium line-through">
                    {formatPrice(product.price)}
                  </p>
                )}
              </div>
              <div className="flex gap-2 sm:flex-col sm:items-end">
                <button
                  type="button"
                  onClick={() => removeWishlistItem(product.id)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-neutral-dark hover:bg-gray-50"
                >
                  <Trash2 className="size-3.5" />
                  Törlés
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addToCart(product, 1);
                    openCart(true);
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-light"
                >
                  <ShoppingCart className="size-3.5" />
                  Kosárba
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
