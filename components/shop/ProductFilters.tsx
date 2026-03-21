"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Filter, X, Star, RotateCcw } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { storefrontCategories } from "@/lib/mock-data";
import { trackEvent } from "@/lib/analytics";
import type { FilterState } from "@/types";

const AGE_GROUPS = [
  "0-3 hónap",
  "3-6 hónap",
  "6-12 hónap",
  "1-2 év",
  "2-3 év",
  "3+ év",
] as const;

const RATING_OPTIONS = [4, 3, 2, 1] as const;

const DEFAULT_PRICE_RANGE: [number, number] = [0, 100000];
const MOBILE_FILTER_MOTION = {
  duration: 0.34,
  ease: [0.22, 1, 0.36, 1] as const,
};
const PRICE_THUMB_RADIUS_PX = 9;
const PRICE_ACTIVE_BAR_INSET_PX = 10;

interface FilterSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({ title, isOpen, onToggle, children }: FilterSectionProps) {
  return (
    <div className="border-b border-primary/10 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3.5 text-left text-sm font-bold text-neutral-dark hover:text-primary transition-colors tracking-tight"
      >
        {title}
        {isOpen ? (
          <ChevronUp className="size-4 text-neutral-medium" />
        ) : (
          <ChevronDown className="size-4 text-neutral-medium" />
        )}
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  );
}

interface ProductFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  priceBounds?: [number, number];
  onMobileClose?: () => void;
  isMobileDrawer?: boolean;
  hideCategoryFilter?: boolean;
}

export function ProductFilters({
  filters,
  onFilterChange,
  priceBounds = DEFAULT_PRICE_RANGE,
  onMobileClose,
  isMobileDrawer = false,
  hideCategoryFilter = false,
}: ProductFiltersProps) {
  const priceSpan = Math.max(1, priceBounds[1] - priceBounds[0]);
  const minThumbPercent = ((filters.priceRange[0] - priceBounds[0]) / priceSpan) * 100;
  const maxThumbGapPercent = ((priceBounds[1] - filters.priceRange[1]) / priceSpan) * 100;

  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    age: true,
    rating: true,
    stock: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    const next = filters.categories.includes(categoryId)
      ? filters.categories.filter((c) => c !== categoryId)
      : [...filters.categories, categoryId];
    onFilterChange({ categories: next });
    trackEvent("filter_change", { filter_type: "category", value: categoryId, active_count: next.length });
  };

  const handlePriceMinChange = (value: number) => {
    const min = Math.min(value, filters.priceRange[1]);
    onFilterChange({ priceRange: [min, filters.priceRange[1]] });
    trackEvent("filter_change", { filter_type: "price_min", value: min });
  };

  const handlePriceMaxChange = (value: number) => {
    const max = Math.max(value, filters.priceRange[0]);
    onFilterChange({ priceRange: [filters.priceRange[0], max] });
    trackEvent("filter_change", { filter_type: "price_max", value: max });
  };

  const handleAgeToggle = (age: string) => {
    const next = filters.ageGroups.includes(age)
      ? filters.ageGroups.filter((a) => a !== age)
      : [...filters.ageGroups, age];
    onFilterChange({ ageGroups: next });
    trackEvent("filter_change", { filter_type: "age_group", value: age, active_count: next.length });
  };

  const handleRatingClick = (stars: number) => {
    const nextRating = filters.rating === stars ? null : stars;
    onFilterChange({
      rating: nextRating,
    });
    trackEvent("filter_change", { filter_type: "rating", value: nextRating ?? "none" });
  };

  const handleInStockToggle = () => {
    const nextValue = !filters.inStock;
    onFilterChange({ inStock: nextValue });
    trackEvent("filter_change", { filter_type: "in_stock", value: nextValue });
  };

  const clearFilters = () => {
    onFilterChange({
      categories: [],
      priceRange: priceBounds,
      ageGroups: [],
      rating: null,
      inStock: false,
    });
    trackEvent("filter_clear");
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.priceRange[0] !== priceBounds[0] ||
    filters.priceRange[1] !== priceBounds[1] ||
    filters.ageGroups.length > 0 ||
    filters.rating !== null ||
    filters.inStock;

  const panelContent = (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 -mx-5 px-5 py-3.5 mb-2 bg-gradient-to-r from-primary/10 to-brand-pink/10 backdrop-blur border-b border-primary/15">
        <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base text-neutral-dark tracking-tight">
          Szűrők
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-light transition-colors"
            >
              <RotateCcw className="size-3" />
              Törlés
            </button>
          )}
          {isMobileDrawer && onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="p-2 rounded-xl bg-white/70 hover:bg-white text-neutral-medium shadow-sm"
              aria-label="Szűrők bezárása"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Category filter — pill chips */}
        {!hideCategoryFilter && (
          <FilterSection
            title="Kategória"
            isOpen={openSections.category}
            onToggle={() => toggleSection("category")}
          >
            <div className="flex flex-wrap gap-1.5">
              {storefrontCategories.map((cat) => {
                const isActive = filters.categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "bg-gray-100 text-neutral-dark/70 hover:bg-gray-200 hover:text-neutral-dark"
                    )}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* Price filter */}
        <FilterSection
          title="Ár"
          isOpen={openSections.price}
          onToggle={() => toggleSection("price")}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-primary">
                {formatPrice(filters.priceRange[0])}
              </span>
              <span className="text-xs text-neutral-medium">—</span>
              <span className="text-sm font-bold text-primary">
                {formatPrice(filters.priceRange[1])}
              </span>
            </div>
            <div className="relative pt-1 px-0.5">
              <div className="relative h-8 flex items-center">
                <div className="absolute left-[9px] right-[9px] h-1.5 rounded-full bg-gray-200" />
                <div
                  className="absolute h-1.5 rounded-full bg-primary"
                  style={{
                    left: `calc(${minThumbPercent}% + ${PRICE_ACTIVE_BAR_INSET_PX}px)`,
                    right: `calc(${maxThumbGapPercent}% + ${PRICE_ACTIVE_BAR_INSET_PX}px)`,
                  }}
                />
                <input
                  type="range"
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  step={500}
                  value={filters.priceRange[0]}
                  onChange={(e) => handlePriceMinChange(Number(e.target.value))}
                  className="range-thumb absolute top-1/2 -translate-y-1/2 left-[9px] w-[calc(100%-18px)] h-5 bg-transparent appearance-none cursor-pointer z-20 touch-none m-0"
                  aria-label="Minimum ár"
                />
                <input
                  type="range"
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  step={500}
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceMaxChange(Number(e.target.value))}
                  className="range-thumb absolute top-1/2 -translate-y-1/2 left-[9px] w-[calc(100%-18px)] h-5 bg-transparent appearance-none cursor-pointer z-30 touch-none m-0"
                  aria-label="Maximum ár"
                />
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Age filter — pill chips */}
        <FilterSection
          title="Korosztály"
          isOpen={openSections.age}
          onToggle={() => toggleSection("age")}
        >
          <div className="flex flex-wrap gap-1.5">
            {AGE_GROUPS.map((age) => {
              const isActive = filters.ageGroups.includes(age);
              return (
                <button
                  key={age}
                  type="button"
                  onClick={() => handleAgeToggle(age)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
                    isActive
                      ? "bg-brand-cyan text-white shadow-sm"
                      : "bg-gray-100 text-neutral-dark/70 hover:bg-gray-200 hover:text-neutral-dark"
                  )}
                >
                  {age}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Rating filter — star icons */}
        <FilterSection
          title="Értékelés"
          isOpen={openSections.rating}
          onToggle={() => toggleSection("rating")}
        >
          <div className="space-y-1">
            {RATING_OPTIONS.map((stars) => (
              <button
                key={stars}
                type="button"
                onClick={() => handleRatingClick(stars)}
                className={cn(
                  "flex w-full items-center gap-2.5 py-2 px-3 rounded-lg transition-all duration-200 text-left",
                  filters.rating === stars
                    ? "bg-primary/10 ring-1 ring-primary/30"
                    : "hover:bg-gray-50"
                )}
              >
                <span className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={cn(
                        "size-4",
                        i <= stars
                          ? "fill-amber-400 text-amber-400"
                          : "fill-gray-200 text-gray-200"
                      )}
                    />
                  ))}
                </span>
                <span className="text-xs font-semibold text-neutral-dark">
                  {stars}+ felett
                </span>
              </button>
            ))}
          </div>
        </FilterSection>

        {/* In stock toggle */}
        <FilterSection
          title="Készleten"
          isOpen={openSections.stock}
          onToggle={() => toggleSection("stock")}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-dark">
              Csak raktáron lévők
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={filters.inStock}
              onClick={handleInStockToggle}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
                filters.inStock ? "bg-emerald-500" : "bg-gray-200"
              )}
            >
              <span
                className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 absolute top-0.5"
                style={{
                  left: filters.inStock ? "calc(100% - 22px)" : "2px",
                }}
              />
            </button>
          </div>
        </FilterSection>
      </div>
    </div>
  );

  if (isMobileDrawer) {
    return (
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={MOBILE_FILTER_MOTION}
        className="fixed inset-0 z-50 lg:hidden flex"
      >
        <div className="w-[88vw] max-w-[380px] bg-gradient-to-b from-white via-[#fcfaff] to-[#f6f0ff] shadow-[0_20px_40px_rgba(49,15,110,0.22)] flex flex-col border-r border-primary/20 rounded-r-3xl overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 pb-3">
            {panelContent}
          </div>
          <div className="border-t border-primary/10 p-4 bg-white/95 backdrop-blur">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-dark hover:bg-primary-pale/30 transition-colors"
              >
                <RotateCcw className="size-4" />
                Törlés
              </button>
              <button
                type="button"
                onClick={() => onMobileClose?.()}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-white hover:bg-primary-light transition-colors"
              >
                Alkalmaz
              </button>
            </div>
          </div>
        </div>
        <div
          onClick={onMobileClose}
          className="flex-1 bg-black/40 backdrop-blur-[2px]"
          aria-hidden="true"
        />
      </motion.div>
    );
  }

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-36">{panelContent}</div>
    </aside>
  );
}

interface ProductFiltersTriggerProps {
  onClick: () => void;
  activeCount?: number;
  variant?: "inline" | "floating";
  className?: string;
  isOpen?: boolean;
}

export function ProductFiltersTrigger({
  onClick,
  activeCount = 0,
  variant = "inline",
  className,
  isOpen = false,
}: ProductFiltersTriggerProps) {
  if (variant === "floating") {
    const [drawerOffsetPx, setDrawerOffsetPx] = useState(320);

    useEffect(() => {
      const updateOffset = () => {
        if (typeof window === "undefined") return;
        setDrawerOffsetPx(Math.min(window.innerWidth * 0.88, 380));
      };
      updateOffset();
      window.addEventListener("resize", updateOffset);
      return () => window.removeEventListener("resize", updateOffset);
    }, []);

    return (
      <motion.button
        type="button"
        onClick={onClick}
        animate={{ x: isOpen ? drawerOffsetPx : 0 }}
        transition={MOBILE_FILTER_MOTION}
        className={cn(
          "fixed left-0 top-1/2 z-[60] -translate-y-1/2 lg:hidden",
          "h-32 w-12 overflow-hidden rounded-r-3xl border border-l-0 border-primary/70 bg-primary shadow-[0_14px_32px_rgba(83,24,173,0.35)]",
          "text-white",
          "hover:brightness-105 active:scale-[0.98] will-change-transform",
          className
        )}
        aria-label="Szűrők megnyitása"
      >
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex origin-center items-center gap-1 -rotate-90 whitespace-nowrap text-[12px] font-black tracking-[0.06em] leading-none">
            <Filter className="size-4 text-white" />
            <span>SZŰRŐK</span>
          </span>
        </span>
        {activeCount > 0 && (
          <span className="absolute right-1 top-1 size-5 rounded-full bg-[#f5c300] text-black text-[10px] font-black flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-neutral-dark hover:border-primary/30 transition-colors",
        className
      )}
    >
      <Filter className="size-4" />
      Szűrők
      {activeCount > 0 && (
        <span className="size-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
          {activeCount}
        </span>
      )}
    </button>
  );
}
