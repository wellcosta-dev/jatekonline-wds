"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const forgotPasswordSchema = z.object({
  email: z.string().email("Érvényes email címet adj meg"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    console.log("Forgot password submitted:", data);
    setSubmitted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      <div className="card p-8 shadow-medium">
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h1 className="text-2xl font-display font-bold text-neutral-dark mb-2">
                  Elfelejtett jelszó
                </h1>
                <p className="text-neutral-medium text-sm">
                  Add meg az email címedet és küldünk egy jelszó visszaállító
                  linket.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                      "input-field",
                      errors.email && "border-error focus:ring-error/30"
                    )}
                    placeholder="email@pelda.hu"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-error">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full"
                >
                  Link küldése
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center py-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-pale mb-6">
                <Mail className="size-8 text-primary" />
              </div>
              <h2 className="text-xl font-display font-bold text-neutral-dark mb-2">
                Ellenőrizd az email fiókod!
              </h2>
              <p className="text-neutral-medium text-sm mb-6">
                Ha van regisztrált fiók az megadott email címmel, küldtünk egy
                jelszó visszaállító linket. Nézd meg a postafiókodat (és a spam
                mappát is).
              </p>
              <Link
                href="/bejelentkezes"
                className="inline-flex items-center gap-2 text-primary hover:text-primary-light font-semibold transition-colors"
              >
                <ArrowLeft className="size-4" />
                Vissza a bejelentkezéshez
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
