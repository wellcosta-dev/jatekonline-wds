"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Heart,
  ShoppingBag,
  Menu,
  Truck,
} from "lucide-react";
import { cn, formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { useCartStore } from "@/store/cartStore";
import { useUiStore } from "@/store/uiStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { storefrontCategories } from "@/lib/mock-data";
import { MobileMenu } from "./MobileMenu";
import { SearchBar } from "./SearchBar";

const NAV_CATEGORIES: Array<{ name: string; slug: string; isSale?: boolean }> = [
  ...storefrontCategories.map((c) => ({ name: c.name, slug: c.slug })),
  { name: "Akciók", slug: "akciok", isSale: true },
];

const FREE_SHIPPING_ANNOUNCEMENT = `Ingyenes szállítás ${formatPrice(FREE_SHIPPING_THRESHOLD)} feletti rendelés esetén`;
const ANNOUNCEMENT_REPEAT_COUNT = 6;

export function Header() {
  const itemCount = useCartStore((s) => s.itemCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const toggleMobileMenu = useUiStore((s) => s.toggleMobileMenu);
  const [isHydrated, setIsHydrated] = useState(false);
  const [accountHref, setAccountHref] = useState("/bejelentkezes");
  const [accountLabel, setAccountLabel] = useState("Bejelentkezés");
  const [isAdminSession, setIsAdminSession] = useState(false);
  const mainHeaderRef = useRef<HTMLElement | null>(null);
  const [mainHeaderHeight, setMainHeaderHeight] = useState(88);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!active) return;
        if (!response.ok) {
          setAccountHref("/bejelentkezes");
          setAccountLabel("Bejelentkezés");
          setIsAdminSession(false);
          return;
        }
        const role = (payload.user?.role as "ADMIN" | "CUSTOMER" | undefined) ?? "CUSTOMER";
        setAccountHref(role === "ADMIN" ? "/admin" : "/fiokom");
        setAccountLabel(role === "ADMIN" ? "Admin" : "Fiókom");
        setIsAdminSession(role === "ADMIN");
      })
      .catch(() => {
        if (active) {
          setAccountHref("/bejelentkezes");
          setAccountLabel("Bejelentkezés");
          setIsAdminSession(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const element = mainHeaderRef.current;
    if (!element) return;
    const updateHeight = () => {
      setMainHeaderHeight(element.offsetHeight || 88);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    window.addEventListener("resize", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  return (
    <>
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-accent text-neutral-dark text-sm border-b border-black/10"
      >
        <div className="container mx-auto px-4 py-1.5">
          <div
            className="announce-marquee overflow-hidden rounded-full border border-black/5 bg-white/45 px-2 py-1"
            role="region"
            aria-label="Szállítási és vásárlási információk"
          >
            <div className="announce-track whitespace-nowrap">
              {[0, 1].map((copy) => (
                <div key={copy} className="flex items-center">
                  {Array.from({ length: ANNOUNCEMENT_REPEAT_COUNT }).map((_, index) => (
                    <span
                      key={`${copy}-${index}`}
                      className="inline-flex items-center gap-2 pr-8 font-semibold text-[11px] sm:text-xs tracking-[0.01em]"
                    >
                      <Truck className="size-3.5 text-primary" />
                      <span>{FREE_SHIPPING_ANNOUNCEMENT}</span>
                      <span aria-hidden className="size-1.5 rounded-full bg-primary/40" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main header */}
      <motion.header
        ref={mainHeaderRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-primary sticky top-0 z-40 shadow-lg"
      >
        <div className="container mx-auto px-4 py-3.5 md:py-3">
          <div className="relative flex items-center justify-between gap-2.5 sm:gap-3">
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="focus-ring lg:hidden p-3 -ml-1 rounded-xl hover:bg-white/15 transition-colors shrink-0"
              aria-label="Menü megnyitása"
            >
              <Menu className="size-7 text-white" />
            </button>

            {/* Logo */}
            <Link
              href="/"
              onClick={() =>
                trackEvent("navigation_click", { location: "header", target: "home_logo" })
              }
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 group min-w-0 lg:static lg:translate-x-0 lg:flex-none"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 min-w-0"
              >
                <Image
                  src="/babyonline-logo.png"
                  alt="BabyOnline.hu"
                  width={320}
                  height={90}
                  priority
                  className="h-14 sm:h-12 md:h-14 lg:h-16 w-auto max-w-full"
                />
              </motion.div>
            </Link>

            {/* Search bar - hidden on mobile */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <SearchBar />
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {isAdminSession ? (
                <span className="hidden md:inline-flex items-center rounded-full border border-amber-200 bg-amber-300 px-2.5 py-1 text-[11px] font-extrabold text-neutral-dark mr-1 whitespace-nowrap">
                  Admin bejelentkezve
                </span>
              ) : null}
              <Link
                href={accountHref}
                className="focus-ring p-2.5 sm:p-2 rounded-xl hover:bg-white/15 transition-colors"
                aria-label={accountLabel}
              >
                <User className="size-6 sm:size-5 text-white/90" />
              </Link>
              <Link
                href="/kivansaglista"
                className="focus-ring hidden sm:block p-1.5 sm:p-2 rounded-lg hover:bg-white/15 transition-colors relative"
                aria-label="Kedvencek"
              >
                <Heart className="size-4 sm:size-5 text-white/90" />
                {isHydrated && wishlistCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-full bg-accent text-neutral-dark text-xs font-bold flex items-center justify-center px-1 shadow-md"
                  >
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </motion.span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => useCartStore.getState().toggleDrawer()}
                className="focus-ring p-2.5 sm:p-2 rounded-xl hover:bg-white/15 transition-colors relative"
                aria-label="Kosár"
              >
                <ShoppingBag className="size-6 sm:size-5 text-white/90" />
                {isHydrated && itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-full bg-accent text-neutral-dark text-xs font-bold flex items-center justify-center px-1 shadow-md"
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </motion.span>
                )}
              </button>
            </div>
          </div>

          <div className="mt-3 md:hidden">
            <SearchBar />
          </div>
        </div>

      </motion.header>

      {/* Category navigation bar — separate from header */}
      <nav
        className="hidden md:block bg-white border-b border-gray-100 sticky z-30 shadow-sm"
        style={{ top: `${mainHeaderHeight}px` }}
      >
        <div className="container mx-auto px-4">
          <ul className="flex items-center md:justify-start lg:justify-center gap-1 py-2 overflow-x-auto scrollbar-hide">
            {NAV_CATEGORIES.map((cat) => (
              <li key={cat.slug} className="flex-shrink-0">
                <Link
                  href={cat.isSale ? "/akciok" : `/kategoriak/${cat.slug}`}
                  onClick={() =>
                    trackEvent("navigation_click", {
                      location: "header_category_nav",
                      target: cat.slug,
                    })
                  }
                  className={cn(
                    "focus-ring block px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-semibold transition-all duration-200",
                    cat.isSale
                      ? "bg-accent text-neutral-dark hover:bg-accent/80"
                      : "text-neutral-dark/80 hover:text-primary hover:bg-primary-pale/60"
                  )}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <MobileMenu />
    </>
  );
}
