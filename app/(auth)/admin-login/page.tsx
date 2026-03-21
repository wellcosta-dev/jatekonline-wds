"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Érvényes email címet adj meg"),
  password: z.string().min(6, "A jelszó legalább 6 karakter"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(null);
    setIsAuthLoading(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "login",
          loginTarget: "admin",
          email: data.email,
          password: data.password,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        user?: { id: string; email: string; name?: string; role?: "CUSTOMER" | "ADMIN" };
      };
      if (!response.ok || payload.user?.role !== "ADMIN") {
        throw new Error(payload.error ?? "Admin bejelentkezés sikertelen.");
      }
      if (typeof window !== "undefined" && payload.user) {
        localStorage.setItem("bo-auth-user", JSON.stringify(payload.user));
      }
      router.push("/admin");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Admin bejelentkezési hiba");
      setIsAuthLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-lg"
    >
      <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-950 to-violet-900 p-8 shadow-xl">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <ShieldCheck className="size-7" />
          </div>
          <h1
            className="text-3xl font-display font-black tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Admin belépés
          </h1>
          <p className="mt-2 text-indigo-100 text-sm">
            Elkülönített belépési pont a BabyOnline admin felülethez.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-indigo-100">
              Admin email
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              className={cn(
                "h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-indigo-200 outline-none transition focus:border-white/50 focus:ring-4 focus:ring-white/20",
                errors.email && "border-red-300 focus:ring-red-300/25"
              )}
              placeholder="admin@pelda.hu"
            />
            {errors.email && <p className="mt-1 text-sm text-red-200">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-indigo-100">
              Jelszó
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className={cn(
                  "h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 pr-12 text-sm text-white placeholder:text-indigo-200 outline-none transition focus:border-white/50 focus:ring-4 focus:ring-white/20",
                  errors.password && "border-red-300 focus:ring-red-300/25"
                )}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-100 hover:text-white"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-200">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isAuthLoading}
            className="mt-2 h-12 w-full rounded-xl bg-white text-indigo-900 font-bold text-sm transition hover:bg-indigo-50 disabled:opacity-60"
          >
            {isSubmitting || isAuthLoading ? "Beléptetés..." : "Belépés adminba"}
          </button>
          {submitError ? (
            <p className="rounded-xl border border-red-300/40 bg-red-400/10 px-3 py-2 text-sm text-red-100 text-center">
              {submitError}
            </p>
          ) : null}
        </form>

        <p className="mt-5 text-center text-sm text-indigo-100">
          Vásárlói bejelentkezés:{" "}
          <Link href="/bejelentkezes" className="font-semibold text-white hover:underline">
            /bejelentkezes
          </Link>
        </p>
      </div>
      {isAuthLoading && (
        <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[2px] flex items-center justify-center">
          <div className="rounded-2xl bg-white px-6 py-5 shadow-lg flex items-center gap-3">
            <Loader2 className="size-5 text-violet-700 animate-spin" />
            <div>
              <p className="text-sm font-bold text-neutral-dark tracking-tight">Admin hitelesítés</p>
              <p className="text-xs text-neutral-medium">Kérlek várj, ellenőrizzük a jogosultságot.</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
