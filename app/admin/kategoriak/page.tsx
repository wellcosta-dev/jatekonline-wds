"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Baby,
  Shirt,
  Car,
  UtensilsCrossed,
  Puzzle,
  Shield,
  Bath,
  Lamp,
  Package,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { categories, products } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const categoryColors = [
  "from-primary/10 to-brand-cyan/10",
  "from-brand-pink/10 to-secondary/10",
  "from-brand-cyan/10 to-primary/10",
  "from-accent/10 to-amber-100",
  "from-emerald-100 to-brand-cyan/10",
  "from-purple-100 to-primary/10",
  "from-rose-100 to-brand-pink/10",
  "from-sky-100 to-brand-cyan/10",
];

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

export default function AdminKategoriakPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const getCategoryProductCount = (id: string) => products.filter((p) => p.categoryId === id).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-dark tracking-tight">Kategóriakezelés</h1>
          <p className="text-sm text-neutral-medium">{categories.length} kategória</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("px-3 py-1.5 text-[10px] font-bold transition-colors", viewMode === "grid" ? "bg-primary text-white" : "bg-white text-neutral-medium hover:bg-gray-50")}
            >
              Rács
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("px-3 py-1.5 text-[10px] font-bold transition-colors", viewMode === "list" ? "bg-primary text-white" : "bg-white text-neutral-medium hover:bg-gray-50")}
            >
              Lista
            </button>
          </div>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary-dark shadow-sm shadow-primary/20 transition-colors">
            <Plus className="size-3.5" />
            Új kategória
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat, i) => {
            const count = getCategoryProductCount(cat.id);
            const Icon = categoryIcons[cat.slug] ?? Package;
            return (
              <div key={cat.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className={cn("h-28 bg-gradient-to-br flex items-center justify-center", categoryColors[i % categoryColors.length])}>
                  <Icon className="size-10 text-neutral-medium/30" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-dark tracking-tight">{cat.name}</h3>
                      <p className="text-[10px] text-neutral-medium mt-0.5 line-clamp-2">{cat.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-[10px] font-bold text-neutral-medium">{count} termék</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-neutral-medium hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Szerkesztés">
                        <Pencil className="size-3" />
                      </button>
                      <Link href={`/kategoriak/${cat.slug}`} className="p-1.5 text-neutral-medium hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Megtekintés">
                        <ArrowUpRight className="size-3" />
                      </Link>
                      <button className="p-1.5 text-neutral-medium hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Törlés">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {categories.map((cat, i) => {
              const count = getCategoryProductCount(cat.id);
              const Icon = categoryIcons[cat.slug] ?? Package;
              return (
                <div key={cat.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                  <GripVertical className="size-4 text-neutral-medium/30 cursor-grab" />
                  <div className={cn("size-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0", categoryColors[i % categoryColors.length])}>
                    <Icon className="size-4 text-neutral-medium/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-neutral-dark tracking-tight">{cat.name}</h3>
                    <p className="text-[10px] text-neutral-medium truncate">{cat.description}</p>
                  </div>
                  <span className="text-[10px] font-bold text-neutral-medium bg-gray-100 px-2 py-0.5 rounded-md">{count} termék</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-neutral-medium hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Szerkesztés">
                      <Pencil className="size-3.5" />
                    </button>
                    <button className="p-1.5 text-neutral-medium hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Törlés">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
