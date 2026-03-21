"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronRight, Heart, Home, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import { useCartStore } from "@/store/cartStore";
import { storefrontCategories, products } from "@/lib/mock-data";

const MENU_LINKS = [
  { href: "/", label: "Főoldal", icon: Home },
  { href: "/termekek", label: "Termékek", icon: ShoppingBag },
  { href: "/akciok", label: "Akciók", icon: ShoppingBag },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/gyik", label: "GYIK", icon: ChevronRight },
  { href: "/kapcsolat", label: "Kapcsolat", icon: ChevronRight },
] as const;

export function MobileMenu() {
  const isOpen = useUiStore((s) => s.isMobileMenuOpen);
  const closeMobileMenu = useUiStore((s) => s.closeMobileMenu);
  const itemCount = useCartStore((s) => s.itemCount());
  const toggleCartDrawer = useUiStore((s) => s.toggleCartDrawer);
  const productCountByCategory = new Map(
    storefrontCategories.map((cat) => [
      cat.id,
      products.filter((product) => product.categoryId === cat.id && product.isActive).length,
    ])
  );

  const handleCartClick = () => {
    closeMobileMenu();
    toggleCartDrawer();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeMobileMenu}
            className="fixed inset-0 bg-neutral-dark/60 backdrop-blur-sm z-50 lg:hidden"
            aria-hidden="true"
          />

          {/* Menu panel */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-full max-w-sm bg-gradient-to-b from-[#f7f2ff] via-[#f3ecff] to-[#efe6ff] text-[#2f2047] shadow-heavy z-50 lg:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="relative flex items-center justify-center p-4 border-b border-[#ddcef5]">
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2"
                >
                  <Image
                    src="/babyonline-logo.png"
                    alt="BabyOnline.hu"
                    width={260}
                    height={72}
                    className="h-10 w-auto"
                  />
                </Link>
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="absolute right-4 p-2.5 rounded-lg bg-[#e9dcff] hover:bg-[#dcc8ff] transition-colors"
                  aria-label="Menü bezárása"
                >
                  <X className="size-7 text-[#3f2b61]" />
                </button>
              </div>

              {/* Menu links */}
              <nav className="flex-1 overflow-y-auto py-5">
                <div className="px-4 space-y-2">
                  <p className="text-xs font-semibold text-[#6f5b91] uppercase tracking-wider mb-2">
                    Kategóriák
                  </p>
                  {storefrontCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/kategoriak/${cat.slug}`}
                      onClick={closeMobileMenu}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl border border-[#ddcef5] bg-white/70",
                        "text-[#2f2047] hover:bg-white hover:border-[#cab4ef]",
                        "font-medium transition-colors"
                      )}
                    >
                      <span>{cat.name}</span>
                      <span className="rounded-full bg-[#f5c300] px-2 py-0.5 text-xs font-bold text-black">
                        {productCountByCategory.get(cat.id) ?? 0}
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="px-4 mt-6 pt-5 border-t border-[#ddcef5]">
                  <p className="text-xs font-semibold text-[#6f5b91] uppercase tracking-wider mb-2">
                    Menüpontok
                  </p>
                  <div className="space-y-1.5">
                    {MENU_LINKS.map((entry) => {
                      const Icon = entry.icon;
                      return (
                        <Link
                          key={entry.href}
                          href={entry.href}
                          onClick={closeMobileMenu}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl",
                            "text-[#2f2047] hover:bg-white/85 hover:text-[#201336]",
                            "transition-colors"
                          )}
                        >
                          <Icon className="size-6 text-[#7f6ba3]" />
                          <span>{entry.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="px-4 mt-6 pt-5 border-t border-[#ddcef5]">
                  <p className="text-xs font-semibold text-[#6f5b91] uppercase tracking-wider mb-2">
                    Fiók
                  </p>
                  <div className="space-y-1.5">
                    <Link
                      href="/bejelentkezes"
                      onClick={closeMobileMenu}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl",
                        "text-[#2f2047] hover:bg-white/85 hover:text-[#201336]",
                        "transition-colors"
                      )}
                    >
                      <User className="size-6 text-[#7f6ba3]" />
                      <span>Bejelentkezés</span>
                    </Link>
                    <Link
                      href="/kivansaglista"
                      onClick={closeMobileMenu}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl",
                        "text-[#2f2047] hover:bg-white/85 hover:text-[#201336]",
                        "transition-colors"
                      )}
                    >
                      <Heart className="size-6 text-[#7f6ba3]" />
                      <span>Kedvencek</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleCartClick}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left",
                        "text-[#2f2047] hover:bg-white/85 hover:text-[#201336]",
                        "transition-colors"
                      )}
                    >
                      <ShoppingBag className="size-6 text-[#7f6ba3]" />
                      <span>Kosár</span>
                      {itemCount > 0 && (
                        <span className="ml-auto bg-[#f5c300] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                          {itemCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </nav>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
