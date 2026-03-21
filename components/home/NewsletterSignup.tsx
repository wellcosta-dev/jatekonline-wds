"use client";

import { useState } from "react";
import { Mail, Check, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "homepage-newsletter" }),
      });
      if (!response.ok) {
        throw new Error("A feliratkozás most nem sikerült.");
      }
      setIsSubmitted(true);
      setEmail("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "A feliratkozás sikertelen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div
          className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden p-8 md:p-12"
          style={{ background: "linear-gradient(135deg, #4e0079 0%, #7B2FBE 50%, #0ebbe4 100%)" }}
        >
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-40 h-40 rounded-full bg-brand-pink/10 blur-2xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                <Gift className="size-4 text-accent" />
                <span className="text-sm font-semibold text-white">10% kedvezmény</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2 tracking-tight">
                Iratkozz fel hírlevelünkre!
              </h2>
              <p className="text-white/80 text-base">
                Kapj <strong className="text-accent">10% kedvezményt</strong> az első rendelésedből, és értesülj elsőként az akciókról!
              </p>
            </div>

            <div className="flex-1 w-full max-w-md">
              {isSubmitted ? (
                <div className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white/15 backdrop-blur-sm text-white">
                  <Check className="size-6 text-emerald-300" />
                  <span className="font-semibold">
                    Köszönjük! Hamarosan kapod az első hírlevelünket.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-neutral-medium" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@pelda.hu"
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border-0 text-neutral-dark placeholder:text-neutral-medium focus:outline-none focus:ring-2 focus:ring-white/50"
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3.5 rounded-xl bg-accent text-neutral-dark font-bold hover:bg-accent/90 transition-colors whitespace-nowrap shadow-lg"
                  >
                    {isLoading ? "Küldés..." : "Feliratkozás"}
                  </button>
                </form>
              )}
              {error && <p className="mt-2 text-xs text-red-200 font-semibold">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
