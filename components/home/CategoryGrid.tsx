"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Baby,
  Shirt,
  Car,
  UtensilsCrossed,
  Puzzle,
  Shield,
  Bath,
  Lamp,
  Package,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { storefrontCategories } from "@/lib/mock-data";

const categoryIcons: Record<string, React.ElementType> = {
  pelenkak: Baby,
  babaruha: Shirt,
  babakocsi: Car,
  etetes: UtensilsCrossed,
  jatekok: Puzzle,
  biztonsag: Shield,
  furdetes: Bath,
  babaszoba: Lamp,
  egyeb: Package,
};

export function CategoryGrid() {
  const displayCategories = storefrontCategories.slice(0, 9);

  return (
    <section className="py-6 md:py-8 flex flex-col">
      <div className="container mx-auto px-4 flex-shrink-0">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 mb-3"
        >
          <h2 className="text-xl font-bold text-neutral-dark tracking-tight">
            Kategóriák
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="container mx-auto px-4"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-3">
          {displayCategories.map((category, index) => {
            const Icon = categoryIcons[category.slug] ?? Package;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                whileHover={{ y: -3, scale: 1.01 }}
              >
                <Link
                  href={`/kategoriak/${category.slug}`}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 sm:px-3.5 sm:py-3 min-w-0",
                    "border border-gray-200 bg-white",
                    "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                    "hover:border-primary/25 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1"
                  )}
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                    <Icon className="size-4 sm:size-4.5" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm sm:text-[15px] font-semibold text-neutral-dark leading-tight whitespace-normal break-words">
                    {category.name}
                  </span>
                  <ArrowRight className="hidden sm:block size-4 text-primary/70 flex-shrink-0 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
