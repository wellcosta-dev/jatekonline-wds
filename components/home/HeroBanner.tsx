"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { Truck, Package, RotateCcw, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: Truck,
    label: "Ingyenes szállítás",
    description: "20 000 Ft feletti rendelésnél",
  },
  {
    icon: Package,
    label: "Gyors kiszállítás",
    description: "1-2 munkanap országszerte",
  },
  {
    icon: RotateCcw,
    label: "Rugalmas visszaküldés",
    description: "30 napos visszaküldési lehetőség",
  },
  {
    icon: ShieldCheck,
    label: "Biztonságos fizetés",
    description: "Megbízható, védett checkout folyamat",
  },
];

export function HeroBanner() {
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!navigatingTo) return;
    const timeout = window.setTimeout(() => setNavigatingTo(null), 8000);
    return () => window.clearTimeout(timeout);
  }, [navigatingTo]);

  const handleBannerClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    setNavigatingTo(href);
  };

  return (
    <section className="relative">
      <div className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
            <motion.article
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45 }}
              whileHover={{ y: -4 }}
              className="relative"
            >
              <Link
                href="/kategoriak/babakocsi"
                aria-label="Babakocsik kategória megnyitása"
                className="group relative block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={(event) => handleBannerClick(event, "/kategoriak/babakocsi")}
              >
                <div className="relative h-[300px] sm:h-[340px] lg:h-auto lg:aspect-[2048/614]">
                  <Image
                    src="/babakocsik-banner.png"
                    alt="Babakocsik banner"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/5" />
                <div className="absolute left-4 top-4 inline-flex rounded-full border border-white/55 bg-white/90 px-3 py-1 text-xs font-bold text-primary shadow-sm">
                  Prémium választék
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                  <div className="rounded-xl bg-black/25 backdrop-blur-[2px] p-3 md:p-3.5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-white drop-shadow text-lg md:text-xl font-extrabold tracking-tight">
                        Babakocsik
                      </p>
                      <p className="text-white/95 drop-shadow text-xs md:text-sm">
                        Kényelmes és megbízható modellek minden élethelyzetre.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-accent px-3 py-2 text-sm font-extrabold text-neutral-dark shadow-md">
                      Megnézem
                      <motion.span
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                        className="inline-flex"
                      >
                        <ArrowRight className="size-4" />
                      </motion.span>
                    </span>
                  </div>
                </div>
                {navigatingTo === "/kategoriak/babakocsi" && (
                  <div className="absolute inset-0 z-20 grid place-items-center bg-black/50 backdrop-blur-[1px]">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-neutral-dark">
                      <Loader2 className="size-4 animate-spin" />
                      Betöltés...
                    </span>
                  </div>
                )}
              </Link>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: 0.08 }}
              whileHover={{ y: -4 }}
              className="relative"
            >
              <Link
                href="/akciok"
                aria-label="Akciós termékek megnyitása"
                className="group relative block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={(event) => handleBannerClick(event, "/akciok")}
              >
                <div className="relative h-[300px] sm:h-[340px] lg:h-auto lg:aspect-[2048/614]">
                  <Image
                    src="/akcios-termekek.png"
                    alt="Akcios termekek banner"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/5" />
                <div className="absolute left-4 top-4 inline-flex rounded-full border border-white/55 bg-white/90 px-3 py-1 text-xs font-bold text-primary shadow-sm">
                  Időszakos kedvezmények
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                  <div className="rounded-xl bg-black/25 backdrop-blur-[2px] p-3 md:p-3.5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-white drop-shadow text-lg md:text-xl font-extrabold tracking-tight">
                        Akciós termékek
                      </p>
                      <p className="text-white/95 drop-shadow text-xs md:text-sm">
                        Népszerű termékek most kedvezményes áron.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-accent px-3 py-2 text-sm font-extrabold text-neutral-dark shadow-md">
                      Megnézem
                      <motion.span
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        className="inline-flex"
                      >
                        <ArrowRight className="size-4" />
                      </motion.span>
                    </span>
                  </div>
                </div>
                {navigatingTo === "/akciok" && (
                  <div className="absolute inset-0 z-20 grid place-items-center bg-black/50 backdrop-blur-[1px]">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-neutral-dark">
                      <Loader2 className="size-4 animate-spin" />
                      Betöltés...
                    </span>
                  </div>
                )}
              </Link>
            </motion.article>
          </div>
        </div>
      </div>

      {/* Trust bar */}
      <div className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-br from-[#f6f7fb] via-[#f2f4f9] to-[#eef2f7] py-6 md:py-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_15%,rgba(78,0,121,0.06),transparent_30%),radial-gradient(circle_at_92%_82%,rgba(14,187,228,0.08),transparent_34%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="mb-4 md:mb-5">
            <p className="text-[11px] md:text-xs font-bold tracking-[0.14em] uppercase text-neutral-medium">
              Miért választják a BabyOnline-t
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3.5">
            {TRUST_ITEMS.map((item, i) => {
              const colors = ["text-brand-cyan", "text-primary", "text-brand-pink", "text-primary"];
              const bgColors = ["bg-brand-cyan/12", "bg-primary/10", "bg-brand-pink/12", "bg-primary/10"];
              return (
                <div
                  key={i}
                  className="group rounded-xl border border-gray-200 bg-white/88 backdrop-blur-sm px-3.5 py-3.5 md:px-4 md:py-4 shadow-[0_6px_14px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_22px_rgba(15,23,42,0.12)]"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex-shrink-0 size-10 rounded-lg ${bgColors[i]} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                    >
                      <item.icon className={`size-5 ${colors[i]}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-dark leading-tight">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs md:text-[13px] text-neutral-medium leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
