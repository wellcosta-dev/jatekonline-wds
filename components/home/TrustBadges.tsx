"use client";

import { ShieldCheck, Truck, RotateCcw, CreditCard } from "lucide-react";

const badges = [
  {
    icon: ShieldCheck,
    title: "Biztonságos fizetés",
    desc: "SSL titkosítás, Stripe",
    color: "text-brand-cyan",
    bg: "bg-brand-cyan/10",
    border: "border-brand-cyan/20",
  },
  {
    icon: Truck,
    title: "Gyors szállítás",
    desc: "1-2 munkanapon belül",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: RotateCcw,
    title: "30 napos visszaküldés",
    desc: "Kérdés nélkül",
    color: "text-brand-pink",
    bg: "bg-brand-pink/10",
    border: "border-brand-pink/20",
  },
  {
    icon: CreditCard,
    title: "Rugalmas fizetés",
    desc: "Kártya, utánvét, átutalás",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
];

export function TrustBadges() {
  return (
    <section className="py-8 md:py-12 bg-neutral-pale">
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-bold text-neutral-dark tracking-tight text-center mb-8">
          Miért válassz minket?
        </h2>
        <div className="mx-auto w-full max-w-5xl grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {badges.map(({ icon: Icon, title, desc, color, bg, border }) => (
            <div
              key={title}
              className={`group relative bg-white rounded-2xl border ${border} p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default`}
            >
              <div className={`inline-flex size-12 rounded-xl ${bg} items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110`}>
                <Icon className={`size-6 ${color}`} strokeWidth={1.8} />
              </div>
              <h3 className="text-sm font-bold text-neutral-dark mb-1">{title}</h3>
              <p className="text-xs text-neutral-medium leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
