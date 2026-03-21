"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Érvényes email címet adj meg"),
  password: z.string().min(6, "A jelszó legalább 6 karakter"),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
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
    defaultValues: { remember: false },
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
          loginTarget: "customer",
          email: data.email,
          password: data.password,
          remember: data.remember ?? false,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        user?: { id: string; email: string; name?: string; role?: "CUSTOMER" | "ADMIN" };
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "A bejelentkezés sikertelen.");
      }
      if (typeof window !== "undefined" && payload.user) {
        localStorage.setItem("bo-auth-user", JSON.stringify(payload.user));
      }
      router.push(payload.user?.role === "ADMIN" ? "/admin" : "/fiokom");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Bejelentkezési hiba");
      setIsAuthLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-xl"
    >
      <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-white p-8 shadow-xl">
        <div className="pointer-events-none absolute -top-20 -right-20 size-52 rounded-full bg-violet-100/80 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-52 rounded-full bg-brand-cyan/10 blur-2xl" />
        <div className="relative text-center mb-8">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200">
            <Sparkles className="size-6" />
          </div>
          <h1
            className="text-3xl font-display font-black text-neutral-dark mb-2 tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Bejelentkezés
          </h1>
          <p className="text-neutral-medium text-sm max-w-sm mx-auto">
            Modern, gyors és biztonságos belépés a vásárlói fiókodhoz.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-neutral-dark"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              className={cn(
                "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100",
                errors.email && "border-error focus:ring-error/20"
              )}
              placeholder="email@pelda.hu"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-error">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-neutral-dark"
            >
              Jelszó
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className={cn(
                  "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-12 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100",
                  errors.password && "border-error focus:ring-error/30"
                )}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-medium hover:text-neutral-dark transition-colors"
                aria-label={showPassword ? "Jelszó elrejtése" : "Jelszó megjelenítése"}
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-error">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("remember")}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-neutral-dark">Emlékezz rám</span>
            </label>
            <Link
              href="/elfelejtett-jelszo"
              className="text-sm text-primary hover:text-primary-light font-medium transition-colors"
            >
              Elfelejtett jelszó?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isAuthLoading}
            className="h-12 w-full rounded-xl bg-violet-600 text-white font-bold text-sm transition hover:bg-violet-700 disabled:opacity-60"
          >
            {isSubmitting || isAuthLoading ? "Belépés..." : "Bejelentkezés"}
          </button>
          {submitError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-error text-center">
              {submitError}
            </p>
          )}
        </form>

        <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-xs text-violet-800 flex items-start gap-2">
          <Shield className="size-4 mt-0.5" />
          <p>
            Bruteforce védelem aktív: több sikertelen próbálkozás után ideiglenes zárolás lép életbe.
          </p>
        </div>

        <div className="mt-6 text-center text-sm text-neutral-medium space-y-2">
          <p>
          Nincs még fiókod?{" "}
          <Link
            href="/regisztracio"
            className="text-primary hover:text-primary-light font-semibold transition-colors"
          >
            Regisztrálj!
          </Link>
          </p>
        </div>
      </div>
      {isAuthLoading && (
        <div className="fixed inset-0 z-[70] bg-white/75 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5 shadow-lg flex items-center gap-3">
            <Loader2 className="size-5 text-primary animate-spin" />
            <div>
              <p className="text-sm font-bold text-neutral-dark tracking-tight">Bejelentkezés folyamatban</p>
              <p className="text-xs text-neutral-medium">Kérlek várj, ne zárd be az oldalt.</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
