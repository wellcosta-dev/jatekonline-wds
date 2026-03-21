"use client";

import Link from "next/link";
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
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { storefrontCategories, products } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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

const categoryStyles: {
  bg: string;
  iconBg: string;
  iconColor: string;
  hoverBorder: string;
}[] = [
  { bg: "bg-primary-pale/30", iconBg: "bg-primary/10", iconColor: "text-primary", hoverBorder: "hover:border-primary/30" },
  { bg: "bg-brand-cyan/5", iconBg: "bg-brand-cyan/10", iconColor: "text-brand-cyan", hoverBorder: "hover:border-brand-cyan/30" },
  { bg: "bg-brand-pink/5", iconBg: "bg-brand-pink/10", iconColor: "text-brand-pink", hoverBorder: "hover:border-brand-pink/30" },
  { bg: "bg-accent/5", iconBg: "bg-accent/15", iconColor: "text-amber-600", hoverBorder: "hover:border-accent/40" },
  { bg: "bg-emerald-50/50", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", hoverBorder: "hover:border-emerald-200" },
  { bg: "bg-secondary/5", iconBg: "bg-secondary/10", iconColor: "text-secondary", hoverBorder: "hover:border-secondary/30" },
  { bg: "bg-blue-50/50", iconBg: "bg-blue-100", iconColor: "text-blue-600", hoverBorder: "hover:border-blue-200" },
  { bg: "bg-orange-50/50", iconBg: "bg-orange-100", iconColor: "text-orange-600", hoverBorder: "hover:border-orange-200" },
  { bg: "bg-gray-50", iconBg: "bg-gray-100", iconColor: "text-gray-600", hoverBorder: "hover:border-gray-300" },
];

function getProductCount(categoryId: string): number {
  return products.filter((p) => p.categoryId === categoryId).length;
}

export default function KategoriakPage() {
  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Kategóriák" },
          ]}
          className="mb-6"
        />

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-dark tracking-tight mb-2">
            Kategóriák
          </h1>
          <p className="text-neutral-medium">
            Böngéssz termékeink között kategóriánként
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {storefrontCategories.map((category, index) => {
            const Icon = categoryIcons[category.slug] ?? Package;
            const style = categoryStyles[index % categoryStyles.length];
            const count = category.productCount ?? getProductCount(category.id);

            return (
              <Link
                key={category.id}
                href={`/kategoriak/${category.slug}`}
                className={cn(
                  "group flex items-center gap-4 p-5 rounded-2xl border border-transparent bg-white",
                  "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                  style.hoverBorder
                )}
              >
                <div className={cn("flex-shrink-0 size-14 rounded-2xl flex items-center justify-center", style.iconBg)}>
                  <Icon className={cn("size-7", style.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-neutral-dark tracking-tight group-hover:text-primary transition-colors">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-xs text-neutral-medium mt-0.5 line-clamp-1">{category.description}</p>
                  )}
                  <p className="text-xs font-semibold text-neutral-medium/70 mt-1">
                    {count} termék
                  </p>
                </div>
                <ArrowRight className="size-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
