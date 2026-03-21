"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { categories, storefrontCategories } from "@/lib/mock-data";
import type { Product } from "@/types";
import { toAnalyticsItemFromProduct, trackEvent } from "@/lib/analytics";

interface ProductGridProps {
  products: (Product & { category?: { name: string } })[];
  listName?: string;
  onResetFilters?: () => void;
}

export function ProductGrid({
  products,
  listName = "Product Listing Grid",
  onResetFilters,
}: ProductGridProps) {
  const pathname = usePathname();
  const lastTrackedKeyRef = useRef<string>("");

  const productsWithCategory = useMemo(
    () =>
      products.map((p) => ({
        ...p,
        category: categories.find((c) => c.id === p.categoryId),
      })),
    [products]
  );

  useEffect(() => {
    if (productsWithCategory.length === 0) return;
    const trackedItems = productsWithCategory.slice(0, 20);
    const key = `${pathname}|${listName}|${trackedItems.map((item) => item.id).join(",")}`;
    if (key === lastTrackedKeyRef.current) return;
    lastTrackedKeyRef.current = key;

    trackEvent("view_item_list", {
      item_list_name: listName,
      source_path: pathname,
      items: trackedItems.map((product) =>
        toAnalyticsItemFromProduct(product, { listName })
      ),
    });
  }, [productsWithCategory, listName, pathname]);

  if (productsWithCategory.length === 0) {
    const topCategoryLinks = storefrontCategories.slice(0, 3);
    return (
      <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
          <Package className="size-10 text-neutral-medium" />
        </div>
        <h3 className="font-bold text-xl text-neutral-dark mb-2">
          Nem találtunk terméket
        </h3>
        <p className="text-neutral-medium max-w-sm">
          Próbálja meg módosítani a szűrőket vagy keressen más kategóriában.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light transition-colors"
            >
              Szűrők törlése
            </button>
          )}
          <Link
            href="/termekek"
            className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-dark hover:bg-gray-50 transition-colors"
          >
            Összes termék
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {topCategoryLinks.map((category) => (
            <Link
              key={category.id}
              href={`/kategoriak/${category.slug}`}
              className="rounded-full bg-primary-pale/60 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-pale transition-colors"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {productsWithCategory.map((product) => (
        <div key={product.id}>
          <ProductCard product={product} listName={listName} />
        </div>
      ))}
    </div>
  );
}
