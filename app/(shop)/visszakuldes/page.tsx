import {
  RotateCcw,
  Clock,
  Package,
  CheckCircle,
  ShieldCheck,
  Mail,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
  FileText,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { cn } from "@/lib/utils";
import { MERCHANT_RETURN_DAYS } from "@/lib/merchant-policy";

const STEPS = [
  {
    step: "1",
    title: "Jelezd a szándékod",
    desc: "Írj nekünk e-mailt a hello@babyonline.hu címre a rendelésszámoddal és a visszaküldés okával.",
    icon: Mail,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    step: "2",
    title: "Csomagold be a terméket",
    desc: "A terméket eredeti, sértetlen csomagolásban, a számlával együtt készítsd elő.",
    icon: Package,
    color: "text-brand-cyan",
    bg: "bg-brand-cyan/10",
  },
  {
    step: "3",
    title: "Add fel a csomagot",
    desc: "Küld vissza a csomagot a megadott címre. Futárszolgálatot is szívesen szervezünk neked.",
    icon: Truck,
    color: "text-brand-pink",
    bg: "bg-brand-pink/10",
  },
  {
    step: "4",
    title: "Visszatérítés",
    desc: "A csomag beérkezése után 5 munkanapon belül visszautaljuk a vételárat.",
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
];

const CONDITIONS = [
  `A terméket a kézhezvételtől számított ${MERCHANT_RETURN_DAYS} napon belül visszaküldheted indoklás nélkül.`,
  "A termék legyen eredeti, bontatlan állapotban, sértetlen csomagolásban.",
  "A visszaküldéshez mellékeld a számlát vagy a rendelésszámot.",
  "Higiéniai termékek (pl. cumisüveg, pelenka) bontatlan állapotban küldhetők vissza.",
  "A visszaszállítás költségét a vásárló viseli, kivéve hibás vagy sérült termék esetén.",
];

const FAQ = [
  {
    q: "Mennyi időm van a visszaküldésre?",
    a: `A kézhezvételtől számított ${MERCHANT_RETURN_DAYS} naptári napon belül élhetsz az elállási jogoddal, indoklás nélkül.`,
  },
  {
    q: "Hogyan kapom vissza a pénzemet?",
    a: "A visszaküldött termék beérkezése és ellenőrzése után 5 munkanapon belül visszautaljuk a vételárat az eredeti fizetési módra.",
  },
  {
    q: "Ki fizeti a visszaszállítás költségét?",
    a: "Általános elállás esetén a visszaszállítás költsége a vásárlót terheli. Hibás vagy sérült termék esetén mi álljuk a költséget.",
  },
  {
    q: "Cserélhetek is a visszaküldés helyett?",
    a: "Igen! Ha más méretet vagy színt szeretnél, jelezd az e-mailben, és amennyiben elérhető, kicseréljük a terméket.",
  },
];

export default function VisszakuldesPage() {
  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Visszaküldés" },
          ]}
          className="mb-6"
        />

        {/* Hero */}
        <div className="relative rounded-2xl bg-gradient-to-r from-brand-pink to-primary overflow-hidden p-6 md:p-10 mb-10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-white/30" />
            <div className="absolute -bottom-10 -left-10 size-36 rounded-full bg-white/20" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <RotateCcw className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Visszaküldés és csere
              </h1>
              <p className="text-white/80 text-sm mt-1">
                Egyszerű és átlátható visszaküldési feltételek
              </p>
            </div>
          </div>
        </div>

        {/* 14 day guarantee highlight */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 md:p-6 mb-8 flex items-center gap-4">
          <div className="size-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="size-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-dark tracking-tight">
              {MERCHANT_RETURN_DAYS} napos pénzvisszafizetési garancia
            </h2>
            <p className="text-sm text-neutral-medium mt-0.5">
              Ha nem vagy elégedett a termékkel, {MERCHANT_RETURN_DAYS} napon belül indoklás nélkül visszaküldheted.
            </p>
          </div>
        </div>

        {/* Process steps */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-extrabold text-neutral-dark tracking-tight">Hogyan működik a visszaküldés?</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-brand-pink/20 to-transparent" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="text-center">
                    <div className={cn("size-14 rounded-2xl flex items-center justify-center mx-auto mb-3", item.bg)}>
                      <Icon className={cn("size-7", item.color)} />
                    </div>
                    <div className="text-xs font-bold text-neutral-medium/50 uppercase tracking-wider mb-1">
                      {item.step}. lépés
                    </div>
                    <h3 className="text-sm font-bold text-neutral-dark tracking-tight mb-1">{item.title}</h3>
                    <p className="text-xs text-neutral-medium">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-extrabold text-neutral-dark tracking-tight">Visszaküldési feltételek</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <ul className="space-y-3">
              {CONDITIONS.map((cond, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="size-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-neutral-dark leading-relaxed">{cond}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Important note */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 md:p-6 mb-10 flex items-start gap-4">
          <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="size-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-800 tracking-tight mb-1">Fontos tudnivaló</h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              Hibás vagy sérült termék esetén kérjük, készíts fotókat a hibáról és a csomagolásról, majd küldd el a hello@babyonline.hu címre.
              Ebben az esetben a visszaszállítás költségét mi álljuk, és a lehető leggyorsabban intézzük a cserét vagy visszatérítést.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-extrabold text-neutral-dark tracking-tight">Gyakran ismételt kérdések</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-accent/30 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAQ.map((item) => (
              <div key={item.q} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle className="size-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-dark tracking-tight mb-1.5">{item.q}</h3>
                    <p className="text-xs text-neutral-medium leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact + CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="size-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-dark tracking-tight">Kérdésed van?</h3>
              <p className="text-xs text-neutral-medium mt-0.5">
                Írj nekünk: <a href="mailto:hello@babyonline.hu" className="text-primary font-semibold hover:underline">hello@babyonline.hu</a>
              </p>
            </div>
          </div>
          <Link
            href="/termekek"
            className="group bg-gradient-to-r from-primary to-brand-pink rounded-2xl p-6 flex items-center justify-between hover:shadow-lg transition-shadow"
          >
            <div>
              <h3 className="text-sm font-bold text-white">Vásárlás folytatása</h3>
              <p className="text-xs text-white/80 mt-0.5">Böngéssz termékeink között!</p>
            </div>
            <ArrowRight className="size-5 text-white group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
