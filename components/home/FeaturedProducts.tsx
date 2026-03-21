"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import type { Product } from "@/types";

const PER_PAGE_DESKTOP = 5;
const PER_PAGE_MOBILE = 4;
const TOTAL_PRODUCTS = 20;

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [perPage, setPerPage] = useState(PER_PAGE_DESKTOP);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/products?limit=5000", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!active) return;
        if (!response.ok) throw new Error(payload?.error ?? "Nem sikerült betölteni a termékeket.");
        const items = Array.isArray(payload?.products) ? (payload.products as Product[]) : [];
        setProducts(items.filter((item) => item.isActive));
      })
      .catch(() => {
        if (active) setProducts([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const displayProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => {
          if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        })
        .slice(0, TOTAL_PRODUCTS),
    [products]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onResize = () => {
      setPerPage(window.innerWidth < 640 ? PER_PAGE_MOBILE : PER_PAGE_DESKTOP);
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const totalPages = Math.max(1, Math.ceil(displayProducts.length / perPage));

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages - 1));
  }, [totalPages]);

  const currentProducts = displayProducts.slice(
    page * perPage,
    page * perPage + perPage
  );

  const goNext = () => setPage((p) => (p + 1) % totalPages);
  const goPrev = () => setPage((p) => (p - 1 + totalPages) % totalPages);

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6"
        >
          <h2 className="text-xl md:text-2xl font-bold text-neutral-dark tracking-tight">
            Legkedveltebb termékek
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Előző termékek"
              className="focus-ring size-9 rounded-full bg-white shadow-soft flex items-center justify-center text-primary hover:bg-primary-pale transition-colors border border-neutral-pale"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-sm text-neutral-medium font-medium min-w-[3rem] text-center">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={goNext}
              aria-label="Következő termékek"
              className="focus-ring size-9 rounded-full bg-white shadow-soft flex items-center justify-center text-primary hover:bg-primary-pale transition-colors border border-neutral-pale"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </motion.div>

        <div className="relative min-h-[340px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {currentProducts.map((product, i) => (
              <motion.div
                key={`${page}-${product.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
              >
                <ProductCard
                  product={product}
                  listName="Legkedveltebb termékek"
                />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={`focus-ring h-1.5 rounded-full transition-all duration-300 ${
                  i === page
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-neutral-medium/30 hover:bg-neutral-medium/50"
                }`}
                aria-label={`${i + 1}. oldal`}
              />
            ))}
          </div>
          <Link
            href="/termekek"
            className="focus-ring inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:text-primary-light transition-colors"
          >
            Összes termék
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
