"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Facebook, Instagram, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const FOOTER_LINKS = {
  vasarlas: [
    { label: "Termékek", href: "/termekek" },
    { label: "Kategóriák", href: "/kategoriak" },
    { label: "Akciók", href: "/akciok" },
    { label: "Újdonságok", href: "/ujdonsagok" },
  ],
  informacio: [
    { label: "Rólunk", href: "/rolunk" },
    { label: "Blog", href: "/blog" },
    { label: "Szállítás", href: "/szallitas" },
    { label: "Visszaküldés", href: "/visszakuldes" },
    { label: "GYIK", href: "/gyik" },
    { label: "Kapcsolat", href: "/kapcsolat" },
  ],
  segitseg: [
    { label: "Adatvédelem", href: "/adatvedelem" },
    { label: "ÁSZF", href: "/aszf" },
    { label: "Sütik", href: "/sutik" },
    { label: "Mérettáblázat", href: "/merettablazat" },
  ],
};

export function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newsletterEmail.trim() || newsletterStatus === "loading") return;
    setNewsletterStatus("loading");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail, source: "footer-newsletter" }),
      });
      if (!response.ok) throw new Error("Newsletter subscribe failed");
      setNewsletterEmail("");
      setNewsletterStatus("success");
    } catch {
      setNewsletterStatus("error");
    }
  };

  return (
    <footer className="bg-neutral-dark text-white">
      {/* Newsletter section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="border-b border-white/10"
      >
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-1 tracking-tight">
                Iratkozz fel hírlevelünkre
              </h3>
              <p className="text-white/80 text-sm">
                Kapj értesítést akciókról és újdonságokról
              </p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex w-full md:w-auto gap-2 max-w-md">
              <input
                type="email"
                placeholder="E-mail címed"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                required
                disabled={newsletterStatus === "loading"}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl",
                  "bg-white/10 border border-white/20",
                  "placeholder:text-white/60 text-white",
                  "focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent",
                  "transition-all duration-200"
                )}
              />
              <button
                type="submit"
                disabled={newsletterStatus === "loading"}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl",
                  "bg-primary hover:bg-primary-light",
                  "font-semibold transition-colors"
                )}
              >
                <span className="hidden sm:inline">
                  {newsletterStatus === "loading" ? "Küldés..." : "Feliratkozás"}
                </span>
                <Send className="size-4" />
              </button>
            </form>
          </div>
          {newsletterStatus === "success" ? (
            <p className="mt-2 text-xs text-emerald-300">Sikeres feliratkozás.</p>
          ) : null}
          {newsletterStatus === "error" ? (
            <p className="mt-2 text-xs text-red-300">A feliratkozás sikertelen. Próbáld újra.</p>
          ) : null}
        </div>
      </motion.section>

      {/* Columns */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center size-10 rounded-xl bg-primary/30 text-primary-pale">
                <Image
                  src="/fav-babyonline.png"
                  alt="BabyOnline favicon"
                  width={24}
                  height={24}
                  className="size-6 object-contain"
                />
              </div>
              <span className="text-xl font-bold tracking-tight">BabyOnline</span>
            </Link>
            <p className="text-white/80 text-sm mb-4 max-w-xs">
              Magyarország kedvenc baba-mama webshopja
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/babyonlinehu/"
                target="_blank"
                rel="noopener noreferrer"
                className="size-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="size-4" />
              </a>
              <a
                href="https://www.instagram.com/babyonline.hu/"
                target="_blank"
                rel="noopener noreferrer"
                className="size-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="size-4" />
              </a>
            </div>
          </motion.div>

          {/* Vásárlás */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold mb-4">Vásárlás</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.vasarlas.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/80 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Információ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold mb-4">Információ</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.informacio.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/80 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Segítség */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold mb-4">Segítség</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.segitseg.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/80 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/60 text-sm">
              © 2026 BabyOnline.hu. Minden jog fenntartva.
            </p>
            <div className="flex items-center gap-4 text-sm text-white/60">
              <span className="font-medium">Fizetési módok:</span>
              <span>Visa</span>
              <span>Mastercard</span>
              <span>Apple Pay</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
