import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-pale flex flex-col">
      {/* Subtle background pattern */}
      <div
        className="fixed inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(78, 0, 121, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(123, 47, 190, 0.03) 0%, transparent 50%)`,
        }}
      />
      {/* Minimal header: logo linking to home */}
      <header className="flex justify-center pt-8 md:pt-10 pb-4">
        <Link
          href="/"
          className="hover:opacity-90 transition-opacity flex flex-col items-center gap-1.5"
        >
          <Image
            src="/babyonline-logo.png"
            alt="BabyOnline.hu"
            width={640}
            height={180}
            className="h-24 md:h-28 w-auto"
          />
          <span className="text-xs md:text-sm !font-display font-black text-neutral-dark tracking-wide">
            Biztonságos bejelentkezés
          </span>
        </Link>
      </header>
      <div className={cn("flex-1 flex items-center justify-center px-4 py-8")}>
        {children}
      </div>
    </div>
  );
}
