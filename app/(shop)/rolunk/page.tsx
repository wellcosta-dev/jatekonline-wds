"use client";

import {
  Heart,
  Mail,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default function RolunkPage() {
  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Rólunk" },
          ]}
          className="mb-6"
        />

        {/* Hero */}
        <section className="relative rounded-3xl bg-gradient-to-br from-primary via-primary-light to-brand-cyan overflow-hidden p-8 md:p-12 lg:p-16 mb-12">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -right-20 size-64 rounded-full bg-white/40" />
            <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-white/30" />
            <div className="absolute top-1/2 right-1/4 size-32 rounded-full bg-white/20" />
          </div>
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-4 backdrop-blur-sm">
              <Heart className="size-3" /> Rólunk
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-5">
              Családi vállalkozásként a gyerekekért és a szülőkért dolgozunk
            </h1>
            <p className="text-base md:text-lg text-white/85 leading-relaxed">
              A BabyOnline.hu egy családi vállalkozás, amely 2024-ben indult azzal a céllal,
              hogy végigkísérje a gyermek növekedését a mindennapokban. Nálunk ruhákat, játékokat,
              babakocsikat, biztonsági és kényelmi kiegészítőket is találsz egy helyen.
              Olyan webshopot építünk, amely egyszerűbbé és kényelmesebbé teszi a gyerekes életet.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Sparkles className="size-5 text-accent" />
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-neutral-dark tracking-tight">
                Küldetésünk
              </h2>
            </div>
            <p className="text-neutral-medium text-base leading-relaxed max-w-3xl">
              Célunk, hogy kényelmesebbé és egyszerűbbé tegyük a gyermekkort mind a gyerekek,
              mind a kismamák számára. Nem csak termékeket szeretnénk adni, hanem valódi segítséget:
              olyan ajánlásokat, amelyek a hétköznapi helyzetekben is használhatók.
            </p>
            <p className="text-neutral-medium text-base leading-relaxed max-w-3xl mt-4">
              Ezért a marketing jellegű, általános tartalmak helyett életközeli tippeket,
              praktikákat és konkrét megoldásokat adunk át a webshopban böngészőknek.
            </p>
          </div>
        </section>

        {/* What we offer */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-neutral-dark tracking-tight">
              Miben segítünk neked?
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm md:text-base text-neutral-dark">
              <li className="rounded-xl bg-primary-pale/40 px-4 py-3">Babaruhák és mindennapi alapdarabok</li>
              <li className="rounded-xl bg-primary-pale/40 px-4 py-3">Játékok és fejlesztő eszközök</li>
              <li className="rounded-xl bg-primary-pale/40 px-4 py-3">Babakocsik és utazási megoldások</li>
              <li className="rounded-xl bg-primary-pale/40 px-4 py-3">Biztonsági és kényelmi kiegészítők</li>
            </ul>
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-neutral-dark tracking-tight">
              Történetünk röviden
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-brand-cyan/20 to-transparent" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <p className="mb-5 text-sm text-neutral-medium">
              Folyamatosan fejlesztjük a BabyOnline-t, hogy gyorsabb, egyszerűbb és hasznosabb
              segítséget kapj minden élethelyzetben.
            </p>
            <div className="relative pl-7 md:pl-9">
              <div className="absolute left-2.5 top-1 bottom-1 w-px bg-gradient-to-b from-primary via-brand-cyan to-brand-pink rounded-full" />
              <div className="space-y-4 md:space-y-5">
                {[
                  {
                    label: "2024",
                    title: "Elindult a BabyOnline.hu",
                    text: "Családi vállalkozásként webáruház formában kezdtük el a működésünket.",
                  },
                  {
                    label: "2025+",
                    phase: "Folyamatos fejlődés",
                    title: "Kínálatbővítés és egyszerűbb vásárlás",
                    text: "Lépésről lépésre építjük a termékkínálatot és a felhasználóbarát webshop élményt.",
                  },
                  {
                    label: "Ma",
                    title: "Élethelyzetekre szabott segítség",
                    text: "Valós, mindennapi tippekkel és praktikákkal támogatjuk a gyerekes családokat.",
                  },
                ].map((item) => (
                  <article key={item.title} className="relative">
                    <span className="absolute -left-[22px] top-5 z-10 inline-flex size-4 rounded-full border-2 border-white bg-primary shadow-sm" />
                    <div className="rounded-2xl border border-gray-100 bg-gradient-to-r from-white to-primary/5 p-4 md:p-5">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary">
                          {item.label}
                        </span>
                        {"phase" in item && item.phase ? (
                          <span className="inline-flex items-center rounded-full bg-brand-cyan/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-brand-cyan">
                            {item.phase}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="text-sm md:text-base font-bold text-neutral-dark tracking-tight">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-medium leading-relaxed">{item.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Legal & support */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-neutral-dark tracking-tight">
              Fontos tudnivalók
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-brand-pink/20 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="size-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-neutral-dark tracking-tight">Számla és garancia</h3>
              </div>
              <p className="text-sm text-neutral-medium leading-relaxed">
                Minden rendelésről elektronikus számlát állítunk ki, a termékekre vonatkozó
                garancia a számlával érvényesíthető.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
                  <Clock className="size-5 text-brand-cyan" />
                </div>
                <h3 className="text-base font-bold text-neutral-dark tracking-tight">Ügyfélszolgálat</h3>
              </div>
              <p className="text-sm text-neutral-medium leading-relaxed">
                Hétfőtől péntekig: <strong className="text-neutral-dark">8:00 - 16:00</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-neutral-dark tracking-tight">
              Kapcsolat
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="mailto:hello@babyonline.hu"
              className="group bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20 transition-all"
            >
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                <Mail className="size-5 text-primary group-hover:text-white transition-colors" />
              </div>
              <div>
                <div className="text-sm font-bold text-neutral-dark tracking-tight">E-mail</div>
                <div className="text-sm text-neutral-medium">hello@babyonline.hu</div>
              </div>
            </a>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
              <div className="size-12 rounded-xl bg-brand-cyan/10 flex items-center justify-center flex-shrink-0">
                <Heart className="size-5 text-brand-cyan" />
              </div>
              <div>
                <div className="text-sm font-bold text-neutral-dark tracking-tight">Működés</div>
                <div className="text-sm text-neutral-medium">Kizárólag webáruházként működünk</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-primary to-brand-cyan rounded-2xl p-8 md:p-10 text-center">
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight mb-3">
            Készen állsz a következő lépésre?
          </h2>
          <p className="text-white/80 text-sm mb-6 max-w-md mx-auto">
            Nézd meg azokat a termékeket, amelyek tényleg megkönnyítik a gyerekes mindennapokat.
          </p>
          <Link
            href="/termekek"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-primary font-bold text-sm hover:bg-gray-50 transition-colors shadow-lg"
          >
            Megnézem a családbarát kínálatot
            <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
