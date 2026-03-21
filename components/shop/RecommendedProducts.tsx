"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/shop/ProductCard";
import type { Product } from "@/types";

interface RecommendedProductsProps {
  currentProductId: string;
  categoryId: string;
}

export function RecommendedProducts({
  currentProductId,
  categoryId,
}: RecommendedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);

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

  const recommendedProducts = useMemo(() => {
    const sameCategory = products.filter(
      (p) => p.categoryId === categoryId && p.id !== currentProductId
    );
    const others = products.filter(
      (p) => p.categoryId !== categoryId && p.id !== currentProductId
    );

    // Shuffle others for variety
    const shuffled = [...others].sort(() => Math.random() - 0.5);

    // Combine: same category first, then fill with others (max 6-8)
    const combined = [...sameCategory];
    const needed = Math.max(0, 6 - combined.length);
    combined.push(...shuffled.slice(0, needed));

    return combined.slice(0, 8);
  }, [products, currentProductId, categoryId]);

  if (recommendedProducts.length === 0) return null;

  const sectionTitle =
    recommendedProducts.some((p) => p.categoryId === categoryId)
      ? "Mások ezt is megvették"
      : "Neked ajánljuk";

  return (
    <section className="mt-16 md:mt-24">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4 }}
        className="font-bold text-xl md:text-2xl text-neutral-dark mb-6 tracking-tight"
      >
        {sectionTitle}
      </motion.h2>

      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:-mx-6 md:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex gap-4 md:gap-6 pb-4"
        >
          {recommendedProducts.map((product) => (
            <div
              key={product.id}
              className="w-[260px] sm:w-[280px] flex-shrink-0"
            >
              <ProductCard product={product} listName={sectionTitle} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
