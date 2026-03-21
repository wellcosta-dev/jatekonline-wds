"use client";

import { usePathname } from "next/navigation";

export function NonAdminOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  if (isAdminRoute) return null;
  return <>{children}</>;
}

