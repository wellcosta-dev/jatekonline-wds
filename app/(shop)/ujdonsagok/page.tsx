"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ActiveFilterChips } from "@/components/shop/ActiveFilterChips";
import { ProductFilters, ProductFiltersTrigger } from "@/components/shop/ProductFilters";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { cn } from "@/lib/utils";
import type { FilterState, Product, SortOption } from "@/types";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Legújabb" },
  { value: "price-asc", label: "Legolcsóbb" },
  { value: "price-desc", label: "Legdrágább" },
  { value: "rating", label: "Legjobb értékelés" },
  { value: "recommended", label: "Ajánlott" },
];

const DEFAULT_FILTERS: FilterState = {
  categories: [],
  priceRange: [0, 100000],
  ageGroups: [],
  brands: [],
  rating: null,
  inStock: false,
  sortBy: "newest",
};

function filterAndSort(allProducts: Product[], filters: FilterState): Product[] {
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
    result = result.filter((p) => p.rating != null && p.rating >= filters.rating!);
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
    case "recommended":
      result.sort((a, b) => (a.isFeatured ? -1 : b.isFeatured ? 1 : 0));
      break;
    default:
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  return result;
}

export default function UjdonsagokPage() {
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

  const newProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 60),
    [products]
  );

  const priceBounds: [number, number] = useMemo(() => {
    if (newProducts.length === 0) return [0, 100000];
    const prices = newProducts.map((p) => p.salePrice ?? p.price);
    return [Math.min(...prices), Math.max(...prices)];
  }, [newProducts]);

  const [filters, setFilters] = useState<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    priceRange: priceBounds,
  }));
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

  const filteredProducts = useMemo(
    () => filterAndSort(newProducts, filters),
    [filters, newProducts]
  );

  const activeFilterCount =
    (filters.categories.length > 0 ? 1 : 0) +
    (filters.priceRange[0] !== priceBounds[0] || filters.priceRange[1] !== priceBounds[1] ? 1 : 0) +
    (filters.ageGroups.length > 0 ? 1 : 0) +
    (filters.rating !== null ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <Breadcrumb
        items={[
          { label: "Főoldal", href: "/" },
          { label: "Újdonságok" },
        ]}
        className="mb-6"
      />
      <ProductFiltersTrigger
        variant="floating"
        onClick={() => setFilterDrawerOpen((prev) => !prev)}
        activeCount={activeFilterCount}
        isOpen={filterDrawerOpen}
      />

      {/* Header banner */}
      <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-brand-cyan to-primary overflow-hidden p-6 md:p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/30" />
          <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-white/20" />
        </div>
        <div className="relative flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Sparkles className="size-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Újdonságok
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Legújabb termékeink egy helyen
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <p className="text-sm font-semibold text-neutral-dark">
          {filteredProducts.length} találat
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <ProductFiltersTrigger
            onClick={() => setFilterDrawerOpen(true)}
            activeCount={activeFilterCount}
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setSortDropdownOpen((o) => !o)}
              className="flex items-center gap-2 min-w-[180px] justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-neutral-dark hover:border-gray-300 transition-colors"
            >
              <span>
                {SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label ?? "Legújabb"}
              </span>
              <ChevronDown
                className={cn("size-4 transition-transform", sortDropdownOpen && "rotate-180")}
              />
            </button>

            {sortDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setSortDropdownOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-full min-w-[200px] bg-white rounded-xl border border-gray-100 py-1 shadow-lg">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        handleFilterChange({ sortBy: opt.value });
                        setSortDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-sm text-left hover:bg-primary-pale/50 transition-colors",
                        filters.sortBy === opt.value && "bg-primary-pale text-primary font-medium"
                      )}
                    >
                      {opt.label}
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
            listName="Újdonságok"
          />
          {loadingProducts ? (
            <p className="mt-4 text-sm text-neutral-medium">Termékek betöltése...</p>
          ) : null}
        </main>
      </div>
    </div>
  );
}
