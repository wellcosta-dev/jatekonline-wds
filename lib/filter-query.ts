import type { FilterState, SortOption } from "@/types";

const VALID_SORT_OPTIONS: SortOption[] = [
  "recommended",
  "price-asc",
  "price-desc",
  "rating",
  "newest",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function parseFiltersFromSearchParams(
  searchParams: URLSearchParams,
  priceBounds: [number, number],
  defaultSort: SortOption = "recommended"
): FilterState {
  const minBound = priceBounds[0];
  const maxBound = priceBounds[1];

  const categories = (searchParams.get("cat") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const ageGroups = (searchParams.get("age") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const sortFromQuery = searchParams.get("sort") as SortOption | null;
  const sortBy = sortFromQuery && VALID_SORT_OPTIONS.includes(sortFromQuery)
    ? sortFromQuery
    : defaultSort;

  const parsedMin = Number(searchParams.get("min"));
  const parsedMax = Number(searchParams.get("max"));
  const fallbackMin = Number.isFinite(parsedMin) ? parsedMin : minBound;
  const fallbackMax = Number.isFinite(parsedMax) ? parsedMax : maxBound;
  const rangeMin = clamp(Math.min(fallbackMin, fallbackMax), minBound, maxBound);
  const rangeMax = clamp(Math.max(fallbackMin, fallbackMax), minBound, maxBound);

  const ratingRaw = Number(searchParams.get("rating"));
  const rating = Number.isFinite(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5
    ? ratingRaw
    : null;

  const inStockValue = searchParams.get("stock");
  const inStock = inStockValue === "1" || inStockValue === "true";

  return {
    categories,
    priceRange: [rangeMin, rangeMax],
    ageGroups,
    brands: [],
    rating,
    inStock,
    sortBy,
  };
}

export function withFilterSearchParams(
  currentSearchParams: URLSearchParams,
  filters: FilterState,
  priceBounds: [number, number]
) {
  const next = new URLSearchParams(currentSearchParams.toString());

  if (filters.categories.length > 0) next.set("cat", filters.categories.join(","));
  else next.delete("cat");

  if (filters.ageGroups.length > 0) next.set("age", filters.ageGroups.join(","));
  else next.delete("age");

  if (filters.priceRange[0] !== priceBounds[0]) next.set("min", String(filters.priceRange[0]));
  else next.delete("min");

  if (filters.priceRange[1] !== priceBounds[1]) next.set("max", String(filters.priceRange[1]));
  else next.delete("max");

  if (filters.rating !== null) next.set("rating", String(filters.rating));
  else next.delete("rating");

  if (filters.inStock) next.set("stock", "1");
  else next.delete("stock");

  if (filters.sortBy !== "recommended") next.set("sort", filters.sortBy);
  else next.delete("sort");

  return next;
}
