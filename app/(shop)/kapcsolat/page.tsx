"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  CheckCircle,
  Facebook,
  Instagram,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { cn } from "@/lib/utils";

const CONTACT_INFO = [
  {
    title: "E-mail",
    value: "hello@babyonline.hu",
    href: "mailto:hello@babyonline.hu",
    desc: "Általában 24 órán belül válaszolunk",
    icon: Mail,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "Telefon",
    value: "06202982228",
    href: "tel:+36202982228",
    desc: "H-P: 9:00 – 17:00",
    icon: Phone,
    color: "text-brand-cyan",
    bg: "bg-brand-cyan/10",
  },
  {
    title: "Cím",
    value: "4531 Nyírpazony, Hunyadi utca 6.",
    href: undefined,
    desc: "Személyes átvétel előzetes egyeztetés után",
    icon: MapPin,
    color: "text-brand-pink",
    bg: "bg-brand-pink/10",
  },
  {
    title: "Nyitvatartás",
    value: "H-P: 9:00 – 17:00",
    href: undefined,
    desc: "Hétvégén e-mailben elérhetőek vagyunk",
    icon: Clock,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
];

export default function KapcsolatPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Az üzenet küldése sikertelen.");
      }
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Az üzenet küldése sikertelen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all placeholder:text-gray-400";

  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Kapcsolat" },
          ]}
          className="mb-6"
        />

        {/* Hero */}
        <div className="relative rounded-2xl bg-gradient-to-r from-primary to-brand-cyan overflow-hidden p-6 md:p-10 mb-10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-white/30" />
            <div className="absolute -bottom-10 -left-10 size-36 rounded-full bg-white/20" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MessageCircle className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Kapcsolat
              </h1>
              <p className="text-white/80 text-sm mt-1">
                Szívesen segítünk – keress minket bármilyen kérdéssel!
              </p>
            </div>
          </div>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {CONTACT_INFO.map((item) => {
            const Icon = item.icon;
            const Wrapper = item.href ? "a" : "div";
            return (
              <Wrapper
                key={item.title}
                {...(item.href ? { href: item.href } : {})}
                className={cn(
                  "bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all",
                  item.href && "cursor-pointer"
                )}
              >
                <div className={cn("size-11 rounded-xl flex items-center justify-center mb-3", item.bg)}>
                  <Icon className={cn("size-5", item.color)} />
                </div>
                <h3 className="text-xs font-bold text-neutral-medium/60 uppercase tracking-wider mb-1">
                  {item.title}
                </h3>
                <p className="text-sm font-bold text-neutral-dark tracking-tight">{item.value}</p>
                <p className="text-xs text-neutral-medium mt-1">{item.desc}</p>
              </Wrapper>
            );
          })}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Contact form */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-base font-bold text-neutral-dark tracking-tight">Küldj üzenetet</h2>
                <p className="text-xs text-neutral-medium mt-0.5">Töltsd ki az alábbi űrlapot és hamarosan válaszolunk.</p>
              </div>

              <div className="p-6">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="size-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                      <CheckCircle className="size-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-extrabold text-neutral-dark tracking-tight mb-2">
                      Üzeneted elküldve!
                    </h3>
                    <p className="text-sm text-neutral-medium max-w-sm">
                      Köszönjük, hogy írtál nekünk! Általában 24 órán belül válaszolunk az e-mail címedre.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFormState({ name: "", email: "", subject: "", message: "" });
                      }}
                      className="mt-6 text-sm font-semibold text-primary hover:underline"
                    >
                      Új üzenet küldése
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-neutral-dark/70 uppercase tracking-wider">
                          Név *
                        </label>
                        <input
                          type="text"
                          required
                          value={formState.name}
                          onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                          className={inputCls}
                          placeholder="Kovács János"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-neutral-dark/70 uppercase tracking-wider">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          required
                          value={formState.email}
                          onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                          className={inputCls}
                          placeholder="email@pelda.hu"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-neutral-dark/70 uppercase tracking-wider">
                        Tárgy *
                      </label>
                      <input
                        type="text"
                        required
                        value={formState.subject}
                        onChange={(e) => setFormState((s) => ({ ...s, subject: e.target.value }))}
                        className={inputCls}
                        placeholder="Miben segíthetünk?"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-neutral-dark/70 uppercase tracking-wider">
                        Üzenet *
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={formState.message}
                        onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                        className={cn(inputCls, "resize-none")}
                        placeholder="Írd le, miben segíthetünk..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-light transition-colors shadow-lg shadow-primary/20"
                    >
                      <Send className="size-4" />
                      {isSubmitting ? "Küldés..." : "Üzenet küldése"}
                    </button>
                    {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-[320px] flex-shrink-0">
            <div className="lg:sticky lg:top-36 space-y-4">
              {/* Social */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-neutral-dark tracking-tight mb-3">Kövess minket</h3>
                <div className="flex gap-2">
                  <a
                    href="https://www.facebook.com/babyonlinehu/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <Facebook className="size-4" />
                    Facebook
                  </a>
                  <a
                    href="https://www.instagram.com/babyonline.hu/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-50 text-pink-600 text-xs font-semibold hover:bg-pink-100 transition-colors"
                  >
                    <Instagram className="size-4" />
                    Instagram
                  </a>
                </div>
              </div>

              {/* Quick links */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-neutral-dark tracking-tight mb-3">Hasznos linkek</h3>
                <div className="space-y-2">
                  {[
                    { label: "Szállítási információk", href: "/szallitas" },
                    { label: "Visszaküldés és csere", href: "/visszakuldes" },
                    { label: "Gyakran Ismételt Kérdések", href: "/gyik" },
                  ].map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-neutral-dark hover:text-primary transition-colors group"
                    >
                      {link.label}
                      <span className="text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all">→</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Response time */}
              <div className="bg-gradient-to-br from-primary/5 to-brand-cyan/5 rounded-2xl border border-primary/10 p-5 text-center">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="size-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-neutral-dark tracking-tight mb-1">Válaszidő</h3>
                <p className="text-xs text-neutral-medium">
                  Általában <strong className="text-primary">24 órán belül</strong> válaszolunk az üzenetekre.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
