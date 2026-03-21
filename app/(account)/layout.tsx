"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Package, Heart, MapPin, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/fiokom", label: "Fiókom", icon: User },
  { href: "/rendeleseim", label: "Rendeléseim", icon: Package },
  { href: "/kivansaglista", label: "Kívánságlista", icon: Heart },
  { href: "/cimeim", label: "Címeim", icon: MapPin },
  { href: "/beallitasok", label: "Beállítások", icon: Settings },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => {
        if (!active) return;
        if (!response.ok) {
          router.replace("/bejelentkezes");
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (active) router.replace("/bejelentkezes");
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="container mx-auto px-4 py-10 text-sm font-semibold text-neutral-medium">
        Fiók betöltése...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-64 flex-shrink-0">
          <nav className="card p-4 md:p-0 md:bg-transparent md:shadow-none">
            <ul className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors",
                        isActive
                          ? "bg-primary text-white"
                          : "text-neutral-dark hover:bg-primary-pale hover:text-primary"
                      )}
                    >
                      <Icon className="size-5 flex-shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
