"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { categories, searchProducts } from "@/lib/mock-data";
import { toAnalyticsItemFromProduct, trackEvent } from "@/lib/analytics";
import type { Product } from "@/types";

const SEARCH_TYPING_HINTS = [
  "Sport babakocsi",
  "Gyerek játékok",
  "Babakocsi kiegészítők",
  "Pelenkázó táska",
] as const;

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingSlug, setNavigatingSlug] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [animatedHint, setAnimatedHint] = useState("");
  const [hintIndex, setHintIndex] = useState(0);
  const [isDeletingHint, setIsDeletingHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const doSearch = useCallback((q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsSearching(true);
    const found = searchProducts(q, 6);
    setResults(found);
    setIsOpen(true);
    setIsSearching(false);
    setSelectedIndex(-1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 150);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 0) return;

    const activeHint = SEARCH_TYPING_HINTS[hintIndex];
    const hasCompletedWord = animatedHint.length === activeHint.length;
    const hasDeletedWord = animatedHint.length === 0;

    const timeoutMs = isDeletingHint ? 45 : 85;
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeletingHint && hasCompletedWord) {
      timer = setTimeout(() => setIsDeletingHint(true), 1150);
      return () => clearTimeout(timer);
    }

    if (isDeletingHint && hasDeletedWord) {
      timer = setTimeout(() => {
        setIsDeletingHint(false);
        setHintIndex((prev) => (prev + 1) % SEARCH_TYPING_HINTS.length);
      }, 280);
      return () => clearTimeout(timer);
    }

    timer = setTimeout(() => {
      const next = isDeletingHint
        ? activeHint.slice(0, Math.max(0, animatedHint.length - 1))
        : activeHint.slice(0, animatedHint.length + 1);
      setAnimatedHint(next);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [animatedHint, hintIndex, isDeletingHint, query.length]);

  const navigateToProduct = (slug: string) => {
    if (isNavigating) return;
    const selectedProduct = results.find((item) => item.slug === slug);
    if (selectedProduct) {
      trackEvent("select_item", {
        item_list_name: "Header Search",
        source_path: "header-search",
        items: [toAnalyticsItemFromProduct(selectedProduct, { listName: "Header Search" })],
      });
    }
    setIsNavigating(true);
    setNavigatingSlug(slug);
    setIsOpen(false);
    window.setTimeout(() => {
      setQuery("");
      router.push(`/termekek/${slug}`);
    }, 140);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "Enter" && query.length >= 2) {
        setIsOpen(false);
        trackEvent("search", {
          search_term: query,
          source: "header",
        });
        router.push(`/keresek?q=${encodeURIComponent(query)}`);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        navigateToProduct(results[selectedIndex].slug);
      } else {
        setIsOpen(false);
        trackEvent("search", {
          search_term: query,
          source: "header",
        });
        router.push(`/keresek?q=${encodeURIComponent(query)}`);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-medium pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder={
          query.length > 0
            ? "Keresés termékek között..."
            : animatedHint || "Sport babakocsi"
        }
        className={cn(
          "w-full pl-10 pr-10 py-2.5 rounded-xl",
          "border border-white/30 bg-white",
          "placeholder:text-neutral-medium text-neutral-dark text-base md:text-sm",
          "focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white",
          "transition-all duration-200"
        )}
      />
      {query && (
        <button
          type="button"
          onClick={() => { setQuery(""); setResults([]); setIsOpen(false); inputRef.current?.focus(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100 text-neutral-medium z-10"
        >
          <X className="size-3.5" />
        </button>
      )}

      {/* Dropdown results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 text-primary animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="px-4 py-2.5 border-b border-gray-100">
                <span className="text-xs font-semibold text-neutral-medium">
                  {results.length} találat
                </span>
              </div>
              <ul>
                {results.map((product, i) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => navigateToProduct(product.slug)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onMouseLeave={() => setSelectedIndex(-1)}
                      disabled={isNavigating}
                      aria-busy={isNavigating && navigatingSlug === product.slug}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 cursor-pointer bg-white hover:bg-primary-pale/50",
                        i === selectedIndex && "bg-primary-pale/50 ring-1 ring-primary/20",
                        isNavigating && "opacity-90"
                      )}
                    >
                      <div className="size-12 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                        {product.images?.length ? (
                          <Image
                            src={product.images[0]}
                            alt=""
                            width={48}
                            height={48}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary-pale/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-dark truncate">
                          {product.name}
                        </p>
                        <p className="text-sm font-bold text-primary">
                          {formatPrice(product.salePrice ?? product.price)}
                        </p>
                        <p className="text-[11px] text-neutral-medium truncate">
                          {categories.find((category) => category.id === product.categoryId)?.name ?? "Termék"}
                        </p>
                      </div>
                      {isNavigating && navigatingSlug === product.slug && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          <Loader2 className="size-3.5 animate-spin" />
                          Betöltés...
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  trackEvent("search", {
                    search_term: query,
                    source: "header",
                  });
                  router.push(`/keresek?q=${encodeURIComponent(query)}`);
                }}
                className="w-full px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-primary-pale/50 transition-colors duration-150 border-t border-gray-100 cursor-pointer"
              >
                Összes találat megtekintése →
              </button>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-neutral-medium">Nincs találat erre: „{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
