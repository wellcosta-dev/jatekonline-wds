"use client";

import { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  Truck,
  CreditCard,
  RotateCcw,
  Package,
  ShieldCheck,
  Mail,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { cn } from "@/lib/utils";

interface FaqCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  questions: { q: string; a: string }[];
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "rendeles",
    title: "Rendelés",
    icon: Package,
    color: "text-primary",
    bg: "bg-primary/10",
    questions: [
      {
        q: "Hogyan adhatok le rendelést?",
        a: "Böngészd a termékeinket, tedd a kosárba a kívántakat, majd a pénztárnál add meg a szállítási és fizetési adataidat. A rendelés véglegesítése után e-mailben visszaigazolást küldünk.",
      },
      {
        q: "Módosíthatom a megrendelésemet?",
        a: "Ha a rendelésed még nem lett feladva, írj nekünk a hello@babyonline.hu címre és segítünk a módosításban. Feladott csomag esetén sajnos már nem lehetséges a változtatás.",
      },
      {
        q: "Van minimális rendelési összeg?",
        a: "Nincs minimális rendelési összeg, bármilyen értékben leadhatsz rendelést. 20 000 Ft feletti rendelésnél a szállítás ingyenes!",
      },
      {
        q: "Rendelhetek telefonon is?",
        a: "Jelenleg csak a weboldalunkon keresztül lehet rendelést leadni. Ha segítségre van szükséged, írj nekünk e-mailt és készséggel segítünk.",
      },
    ],
  },
  {
    id: "szallitas",
    title: "Szállítás",
    icon: Truck,
    color: "text-brand-cyan",
    bg: "bg-brand-cyan/10",
    questions: [
      {
        q: "Milyen szállítási módok közül választhatok?",
        a: "GLS futárszolgálat (1-2 munkanap), Magyar Posta (2-4 munkanap) és Foxpost csomagautomata (1-3 munkanap) közül választhatsz.",
      },
      {
        q: "Mennyibe kerül a szállítás?",
        a: "GLS Házhozszállítás: 2 390 Ft, Magyar Posta: 2 390 Ft, Foxpost: 890 Ft. 20 000 Ft feletti rendelésnél minden szállítási mód ingyenes!",
      },
      {
        q: "Hogyan követhetem nyomon a csomagomat?",
        a: "A csomag feladása után automatikus e-mailt küldünk a nyomkövetési számmal. Ezzel bármikor ellenőrizheted, hol tart a szállítmányod.",
      },
      {
        q: "Szállítotok külföldre?",
        a: "Jelenleg csak Magyarország területére szállítunk. A jövőben tervezzük a környező országokba történő szállítás bevezetését.",
      },
    ],
  },
  {
    id: "fizetes",
    title: "Fizetés",
    icon: CreditCard,
    color: "text-brand-pink",
    bg: "bg-brand-pink/10",
    questions: [
      {
        q: "Milyen fizetési módokat fogadtok el?",
        a: "Bankkártyás fizetés (Visa, Mastercard) és utánvét. A bankkártyás fizetés biztonságos, SSL titkosított csatornán történik.",
      },
      {
        q: "Biztonságos a bankkártyás fizetés?",
        a: "Igen, a fizetés Stripe rendszeren keresztül történik, amely a legszigorúbb PCI DSS biztonsági szabványoknak megfelel. Kártyaadataidat nem tároljuk.",
      },
      {
        q: "Mennyibe kerül az utánvét?",
        a: "Az utánvétes fizetés kezelési költsége 500 Ft, amit a rendelés végösszegéhez adunk hozzá.",
      },
      {
        q: "Mikor kerül levonásra az összeg?",
        a: "Bankkártyás fizetésnél a rendelés leadásakor azonnal megtörténik a tranzakció. Utánvét esetén a csomag átvételekor fizetsz.",
      },
    ],
  },
  {
    id: "visszakuldes",
    title: "Visszaküldés",
    icon: RotateCcw,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    questions: [
      {
        q: "Mennyi időm van a visszaküldésre?",
        a: "A kézhezvételtől számított 30 naptári napon belül élhetsz az elállási jogoddal, indoklás nélkül.",
      },
      {
        q: "Hogyan küldhetem vissza a terméket?",
        a: "Írj nekünk a hello@babyonline.hu címre a rendelésszámoddal, majd csomagold be a terméket eredeti állapotban és küldd vissza a megadott címre.",
      },
      {
        q: "Mikor kapom vissza a pénzemet?",
        a: "A visszaküldött termék beérkezése és ellenőrzése után 5 munkanapon belül visszautaljuk a vételárat az eredeti fizetési módra.",
      },
      {
        q: "Visszaküldhetem a bontott terméket?",
        a: "Higiéniai okokból a bontott termékeket (pl. cumisüveg, pelenka) nem áll módunkban visszavenni. Bontatlan, eredeti csomagolásban lévő termékeket szívesen fogadunk.",
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left group"
      >
        <span className="text-sm font-semibold text-neutral-dark group-hover:text-primary transition-colors">
          {q}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-neutral-medium flex-shrink-0 transition-transform duration-200",
            open && "rotate-180 text-primary"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-96 pb-4" : "max-h-0"
        )}
      >
        <p className="text-sm text-neutral-medium leading-relaxed pr-8">{a}</p>
      </div>
    </div>
  );
}

export default function GyikPage() {
  const [activeCategory, setActiveCategory] = useState<string>("rendeles");
  const activeCat = FAQ_CATEGORIES.find((c) => c.id === activeCategory) ?? FAQ_CATEGORIES[0];
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_CATEGORIES.flatMap((category) =>
      category.questions.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      }))
    ),
  };

  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        />
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "GYIK" },
          ]}
          className="mb-6"
        />

        {/* Hero */}
        <div className="relative rounded-2xl bg-gradient-to-r from-accent via-amber-400 to-orange-400 overflow-hidden p-6 md:p-10 mb-10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-white/30" />
            <div className="absolute -bottom-10 -left-10 size-36 rounded-full bg-white/20" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <HelpCircle className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Gyakran Ismételt Kérdések
              </h1>
              <p className="text-white/80 text-sm mt-1">
                Válaszok a leggyakoribb kérdésekre
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Category sidebar */}
          <div className="lg:w-[260px] flex-shrink-0">
            <div className="lg:sticky lg:top-36 space-y-2">
              {FAQ_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                      isActive
                        ? "bg-white border border-gray-100 shadow-sm"
                        : "hover:bg-white/60"
                    )}
                  >
                    <div className={cn("size-9 rounded-lg flex items-center justify-center", cat.bg)}>
                      <Icon className={cn("size-4.5", cat.color)} />
                    </div>
                    <div>
                      <span className={cn(
                        "text-sm font-bold tracking-tight",
                        isActive ? "text-neutral-dark" : "text-neutral-medium"
                      )}>
                        {cat.title}
                      </span>
                      <span className="block text-[10px] text-neutral-medium/60">
                        {cat.questions.length} kérdés
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Questions */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                {(() => {
                  const Icon = activeCat.icon;
                  return (
                    <div className={cn("size-8 rounded-lg flex items-center justify-center", activeCat.bg)}>
                      <Icon className={cn("size-4", activeCat.color)} />
                    </div>
                  );
                })()}
                <h2 className="text-base font-bold text-neutral-dark tracking-tight">{activeCat.title}</h2>
              </div>
              <div className="px-6">
                {activeCat.questions.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-10 bg-gradient-to-r from-primary to-brand-cyan rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="size-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Nem találtad a választ?</h3>
              <p className="text-sm text-white/80 mt-0.5">Írj nekünk és hamarosan válaszolunk!</p>
            </div>
          </div>
          <a
            href="mailto:hello@babyonline.hu"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary font-bold text-sm hover:bg-gray-50 transition-colors shadow-lg flex-shrink-0"
          >
            <Mail className="size-4" />
            hello@babyonline.hu
          </a>
        </div>
      </div>
    </div>
  );
}
