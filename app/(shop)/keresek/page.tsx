"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { Search, ChevronDown } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ActiveFilterChips } from "@/components/shop/ActiveFilterChips";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ProductFilters, ProductFiltersTrigger } from "@/components/shop/ProductFilters";
import { parseFiltersFromSearchParams, withFilterSearchParams } from "@/lib/filter-query";
import { cn } from "@/lib/utils";
import type { Product, FilterState, SortOption } from "@/types";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Relevancia" },
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

function textSearch(query: string, products: Product[]): Product[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      (p.shortDesc && p.shortDesc.toLowerCase().includes(q))
  );
}

function applyFilters(allProducts: Product[], filters: FilterState): Product[] {
  let result = [...allProducts];

  if (filters.categories.length > 0) {
    result = result.filter((p) => filters.categories.includes(p.categoryId));
  }

  const [priceMin, priceMax] = filters.priceRange;
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
    case "newest":
      result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      break;
  }

  return result;
}

function KeresekContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(q);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
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
      });
    return () => {
      active = false;
    };
  }, []);

  const searchResults = useMemo(() => textSearch(q, products), [q, products]);

  const priceBounds: [number, number] = useMemo(() => {
    if (searchResults.length === 0) return [0, 100000];
    const prices = searchResults.map((p) => p.salePrice ?? p.price);
    return [Math.min(...prices), Math.max(...prices)];
  }, [searchResults]);

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
    setInputValue(q);
    setFilters(
      parseFiltersFromSearchParams(
        new URLSearchParams(searchParams.toString()),
        priceBounds,
        DEFAULT_FILTERS.sortBy
      )
    );
  }, [q, priceBounds, searchParams]);

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

  const filteredResults = useMemo(
    () => applyFilters(searchResults, filters),
    [searchResults, filters]
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

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...DEFAULT_FILTERS,
      priceRange: priceBounds,
      sortBy: prev.sortBy,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <Head>
        <meta name="robots" content="noindex,follow" />
        <meta name="googlebot" content="noindex,follow" />
      </Head>
      <Breadcrumb
        items={[
          { label: "Főoldal", href: "/" },
          { label: "Keresés" },
        ]}
        className="mb-6"
      />
      <ProductFiltersTrigger
        variant="floating"
        onClick={() => setFilterDrawerOpen((prev) => !prev)}
        activeCount={activeFilterCount}
        isOpen={filterDrawerOpen}
      />

      <div className="mb-6">
        <form action="/keresek" method="get" className="max-w-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-neutral-medium" />
            <input
              type="search"
              name="q"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Keresés termékek között..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-neutral-dark placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </form>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="font-extrabold text-2xl md:text-3xl text-neutral-dark tracking-tight">
          „{q || "..."}"
          <span className="ml-2 text-neutral-medium font-normal text-base">
            ({filteredResults.length} találat)
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
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-neutral-dark hover:border-primary/30 transition-colors min-w-[180px] justify-between"
            >
              <span>
                {SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label ?? "Relevancia"}
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
                <div className="absolute right-0 top-full mt-2 z-50 w-full min-w-[200px] bg-white rounded-xl border border-gray-200 shadow-lg py-1 overflow-hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        handleFilterChange({ sortBy: opt.value });
                        setSortDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm hover:bg-primary-pale/50 transition-colors cursor-pointer",
                        filters.sortBy === opt.value && "bg-primary-pale/50 text-primary font-semibold"
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

      {searchResults.length > 0 ? (
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
              products={filteredResults}
              listName="Keresési találatok"
              onResetFilters={handleResetFilters}
            />
          </main>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-lg mx-auto">
          <h3 className="font-bold text-xl text-neutral-dark mb-2 tracking-tight">
            Nincs találat
          </h3>
          <p className="text-neutral-medium mb-6">
            Próbálj meg más kulcsszavakat használni, vagy böngéssz a kategóriák között.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/termekek" className="btn-primary">
              Összes termék
            </Link>
            <Link href="/" className="btn-outline">
              Főoldal
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KeresekPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Keresés...</div>}>
      <KeresekContent />
    </Suspense>
  );
}
