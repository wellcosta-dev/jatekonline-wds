"use client";

import { X } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { storefrontCategories } from "@/lib/mock-data";
import type { FilterState } from "@/types";

interface ActiveFilterChipsProps {
  filters: FilterState;
  priceBounds: [number, number];
  onFilterChange: (updates: Partial<FilterState>) => void;
  hideCategoryFilter?: boolean;
  className?: string;
}

export function ActiveFilterChips({
  filters,
  priceBounds,
  onFilterChange,
  hideCategoryFilter = false,
  className,
}: ActiveFilterChipsProps) {
  const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  if (!hideCategoryFilter) {
    for (const categoryId of filters.categories) {
      const category = storefrontCategories.find((item) => item.id === categoryId);
      chips.push({
        key: `cat-${categoryId}`,
        label: category ? category.name : "Kategória",
        onRemove: () =>
          onFilterChange({
            categories: filters.categories.filter((entry) => entry !== categoryId),
          }),
      });
    }
  }

  const hasCustomPrice =
    filters.priceRange[0] !== priceBounds[0] ||
    filters.priceRange[1] !== priceBounds[1];
  if (hasCustomPrice) {
    chips.push({
      key: "price",
      label: `${formatPrice(filters.priceRange[0])} - ${formatPrice(filters.priceRange[1])}`,
      onRemove: () => onFilterChange({ priceRange: priceBounds }),
    });
  }

  for (const age of filters.ageGroups) {
    chips.push({
      key: `age-${age}`,
      label: age,
      onRemove: () =>
        onFilterChange({
          ageGroups: filters.ageGroups.filter((entry) => entry !== age),
        }),
    });
  }

  if (filters.rating !== null) {
    chips.push({
      key: "rating",
      label: `${filters.rating}+ csillag`,
      onRemove: () => onFilterChange({ rating: null }),
    });
  }

  if (filters.inStock) {
    chips.push({
      key: "stock",
      label: "Csak raktáron",
      onRemove: () => onFilterChange({ inStock: false }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-dark hover:border-primary/30 hover:bg-primary/5"
        >
          <span>{chip.label}</span>
          <X className="size-3.5 text-neutral-medium" />
        </button>
      ))}
      <button
        type="button"
        onClick={() =>
          onFilterChange({
            categories: [],
            priceRange: priceBounds,
            ageGroups: [],
            rating: null,
            inStock: false,
          })
        }
        className="text-xs font-semibold text-primary hover:text-primary-light transition-colors"
      >
        Összes törlése
      </button>
    </div>
  );
}
