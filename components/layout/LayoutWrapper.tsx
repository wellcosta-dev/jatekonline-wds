"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";

const AUTH_PATHS = ["/bejelentkezes", "/regisztracio", "/elfelejtett-jelszo"];
const ADMIN_PATH = "/admin";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_PATHS.some((p) => pathname?.startsWith(p));
  const isAdminRoute = pathname?.startsWith(ADMIN_PATH);

  if (isAuthRoute || isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
