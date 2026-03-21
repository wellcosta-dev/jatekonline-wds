"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ActiveFilterChips } from "@/components/shop/ActiveFilterChips";
import { ProductFilters, ProductFiltersTrigger } from "@/components/shop/ProductFilters";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { InternalLinksBlock } from "@/components/seo/InternalLinksBlock";
import { parseFiltersFromSearchParams, withFilterSearchParams } from "@/lib/filter-query";
import { cn } from "@/lib/utils";
import { getCollectionInternalLinks } from "@/lib/seo-content";
import type { FilterState, Product, SortOption } from "@/types";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Ajánlott" },
  { value: "price-asc", label: "Legolcsóbb" },
  { value: "price-desc", label: "Legdrágább" },
  { value: "rating", label: "Legjobb értékelés" },
  { value: "newest", label: "Újdonságok" },
];

const DEFAULT_FILTERS: FilterState = {
  categories: [],
  priceRange: [0, 100000],
  ageGroups: [],
  brands: [],
  rating: null,
  inStock: false,
  sortBy: "recommended",
};

function filterAndSortProducts(
  allProducts: Product[],
  filters: FilterState
): Product[] {
  let result = [...allProducts];

  if (filters.categories.length > 0) {
    result = result.filter((p) => filters.categories.includes(p.categoryId));
  }

  const priceMin = filters.priceRange[0];
  const priceMax = filters.priceRange[1];
  result = result.filter((p) => {
    const price = p.salePrice ?? p.price;
    return price >= priceMin && price <= priceMax;
  });

  if (filters.ageGroups.length > 0) {
    result = result.filter((p) => {
      if (!p.ageGroups || p.ageGroups.length === 0) return true;
      return filters.ageGroups.some((ag) => p.ageGroups!.includes(ag));
    });
  }

  if (filters.rating !== null) {
    result = result.filter(
      (p) => p.rating != null && p.rating >= filters.rating!
    );
  }

  if (filters.inStock) {
    result = result.filter((p) => p.stock > 0);
  }

  switch (filters.sortBy) {
    case "price-asc":
      result.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
      break;
    case "price-desc":
      result.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
      break;
    case "rating":
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case "newest":
      result.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      break;
    default:
      result.sort((a, b) => (a.isFeatured ? -1 : b.isFeatured ? 1 : 0));
  }

  return result;
}

export default function TermekekPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingProducts(true);
    fetch("/api/products?limit=5000", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!active) return;
        if (!response.ok) throw new Error(payload?.error ?? "Nem sikerült betölteni a termékeket.");
        const items = Array.isArray(payload?.products) ? (payload.products as Product[]) : [];
        setProducts(items.filter((entry) => entry.isActive));
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const priceBounds: [number, number] = useMemo(() => {
    if (products.length === 0) return [0, 100000];
    const prices = products.map((p) => p.salePrice ?? p.price);
    return [Math.min(...prices), Math.max(...prices)];
  }, [products]);

  const [filters, setFilters] = useState<FilterState>(() =>
    parseFiltersFromSearchParams(
      new URLSearchParams(searchParams.toString()),
      priceBounds,
      DEFAULT_FILTERS.sortBy
    )
  );
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const previousBoundsRef = useRef<[number, number]>(priceBounds);

  useEffect(() => {
    const previousBounds = previousBoundsRef.current;
    setFilters((prev) => {
      const usesPreviousDefault =
        prev.priceRange[0] === previousBounds[0] &&
        prev.priceRange[1] === previousBounds[1];
      const outOfCurrentBounds =
        prev.priceRange[0] < priceBounds[0] ||
        prev.priceRange[1] > priceBounds[1];

      if (!usesPreviousDefault && !outOfCurrentBounds) {
        return prev;
      }
      return { ...prev, priceRange: priceBounds };
    });
    previousBoundsRef.current = priceBounds;
  }, [priceBounds]);

  useEffect(() => {
    const nextSearchParams = withFilterSearchParams(
      new URLSearchParams(searchParams.toString()),
      filters,
      priceBounds
    );
    const next = nextSearchParams.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }
  }, [filters, pathname, priceBounds, router, searchParams]);

  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, filters),
    [filters, products]
  );
  const collectionLinks = useMemo(() => getCollectionInternalLinks(), []);

  const activeFilterCount =
    (filters.categories.length > 0 ? 1 : 0) +
    (filters.priceRange[0] !== priceBounds[0] ||
    filters.priceRange[1] !== priceBounds[1]
      ? 1
      : 0) +
    (filters.ageGroups.length > 0 ? 1 : 0) +
    (filters.rating !== null ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...DEFAULT_FILTERS,
      priceRange: priceBounds,
      sortBy: prev.sortBy,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <Breadcrumb
        items={[
          { label: "Főoldal", href: "/" },
          { label: "Termékek" },
        ]}
        className="mb-6"
      />
      <ProductFiltersTrigger
        variant="floating"
        onClick={() => setFilterDrawerOpen((prev) => !prev)}
        activeCount={activeFilterCount}
        isOpen={filterDrawerOpen}
      />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="font-extrabold text-2xl md:text-3xl text-neutral-dark tracking-tight">
          Termékeink
          <span className="ml-2 text-neutral-medium font-normal text-base">
            ({filteredProducts.length} termék)
          </span>
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <ProductFiltersTrigger
            onClick={() => setFilterDrawerOpen(true)}
            activeCount={activeFilterCount}
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setSortDropdownOpen((o) => !o)}
              className={cn(
                "group flex min-w-[220px] items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-left transition-all",
                sortDropdownOpen
                  ? "border-primary/40 ring-2 ring-primary/10"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <span className="flex flex-col leading-tight">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-medium">
                  Rendezés
                </span>
                <span className="text-sm font-semibold text-neutral-dark">
                  {SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label ?? "Ajánlott"}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "size-4 text-neutral-medium transition-transform",
                  sortDropdownOpen && "rotate-180"
                )}
              />
            </button>

            {sortDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setSortDropdownOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-full min-w-[240px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        handleFilterChange({ sortBy: opt.value });
                        setSortDropdownOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50",
                        filters.sortBy === opt.value &&
                          "bg-primary/5 text-primary font-semibold"
                      )}
                    >
                      <span>{opt.label}</span>
                      {filters.sortBy === opt.value && (
                        <Check className="size-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        <ProductFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          priceBounds={priceBounds}
        />

        <AnimatePresence>
          {filterDrawerOpen && (
            <ProductFilters
              key="filter-drawer"
              filters={filters}
              onFilterChange={handleFilterChange}
              priceBounds={priceBounds}
              isMobileDrawer
              onMobileClose={() => setFilterDrawerOpen(false)}
            />
          )}
        </AnimatePresence>

        <main className="flex-1 min-w-0">
          <ActiveFilterChips
            filters={filters}
            onFilterChange={handleFilterChange}
            priceBounds={priceBounds}
          />
          <ProductGrid
            products={filteredProducts}
            listName="Termékek lista"
            onResetFilters={handleResetFilters}
          />
          {loadingProducts ? (
            <p className="mt-4 text-sm text-neutral-medium">Termékek betöltése...</p>
          ) : null}
          <section className="mt-8 md:mt-10 rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-neutral-dark mb-3">
              Baba-mama vásárlási útmutató
            </h2>
            <p className="text-sm md:text-base text-neutral-medium leading-relaxed">
              A termékoldalon ár, értékelés, korosztály és készlet alapján gyorsan tudsz szűrni.
              Így könnyebb megtalálni azokat a termékeket, amelyek tényleg illenek a napi
              rutinhoz, a baba életkorához és a család igényeihez.
            </p>
          </section>
          <InternalLinksBlock
            title="Felfedezésre ajánlott oldalak"
            links={collectionLinks}
            className="mt-5"
          />
        </main>
      </div>
    </div>
  );
}
