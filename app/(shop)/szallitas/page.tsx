import {
  Truck,
  Mail,
  Package,
  Clock,
  ShieldCheck,
  MapPin,
  CreditCard,
  CheckCircle,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { cn, formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/utils";

const SHIPPING_METHODS = [
  {
    name: "GLS Futárszolgálat",
    price: "2 390 Ft",
    freeAbove: true,
    time: "1-2 munkanap",
    description: "Házhoz szállítás futárral, nyomon követhető csomagfeladással.",
    icon: Truck,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    name: "Magyar Posta",
    price: "2 390 Ft",
    freeAbove: true,
    time: "2-4 munkanap",
    description: "Postai kézbesítés az ország bármely pontjára.",
    icon: Mail,
    color: "text-brand-cyan",
    bg: "bg-brand-cyan/10",
  },
  {
    name: "Foxpost Csomagautomata",
    price: "890 Ft",
    freeAbove: true,
    time: "1-3 munkanap",
    description: "Automatából veheted át, amikor neked a legkényelmesebb.",
    icon: Package,
    color: "text-brand-pink",
    bg: "bg-brand-pink/10",
  },
];

const FAQ = [
  {
    q: "Mennyi idő alatt érkezik meg a rendelésem?",
    a: "A legtöbb rendelés 1-3 munkanapon belül megérkezik. GLS futárszolgálattal 1-2, Magyar Postával 2-4, Foxpost automatával 1-3 munkanap a szállítási idő.",
  },
  {
    q: "Hogyan követhetem nyomon a csomagomat?",
    a: "A csomag feladása után automatikus e-mailt küldünk a nyomkövetési számmal. Ezzel bármikor ellenőrizheted, hol tart a szállítmányod.",
  },
  {
    q: "Mi történik, ha nem vagyok otthon a kézbesítéskor?",
    a: "A futár értesítőt hagy, és másnap újra megkísérli a kézbesítést. Foxpost automatánál 3 napig átveheted a csomagot.",
  },
  {
    q: "Szállítotok külföldre?",
    a: "Jelenleg csak Magyarország területére szállítunk. A jövőben tervezzük a környező országokba történő szállítás bevezetését.",
  },
];

export default function SzallitasPage() {
  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Szállítás" },
          ]}
          className="mb-6"
        />

        {/* Hero */}
        <div className="relative rounded-2xl bg-gradient-to-r from-brand-cyan to-primary overflow-hidden p-6 md:p-10 mb-10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-white/30" />
            <div className="absolute -bottom-10 -left-10 size-36 rounded-full bg-white/20" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Truck className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Szállítási információk
              </h1>
              <p className="text-white/80 text-sm mt-1">
                Gyors, megbízható szállítás az ország bármely pontjára
              </p>
            </div>
          </div>
        </div>

        {/* Free shipping highlight */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 md:p-6 mb-8 flex items-center gap-4">
          <div className="size-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="size-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-dark tracking-tight">
              Ingyenes szállítás {formatPrice(FREE_SHIPPING_THRESHOLD)} felett!
            </h2>
            <p className="text-sm text-neutral-medium mt-0.5">
              Minden szállítási mód ingyenes, ha a kosár értéke eléri a {formatPrice(FREE_SHIPPING_THRESHOLD)}-ot.
            </p>
          </div>
        </div>

        {/* Shipping methods */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-extrabold text-neutral-dark tracking-tight">Szállítási módok</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SHIPPING_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.name}
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className={cn("size-12 rounded-xl flex items-center justify-center mb-4", method.bg)}>
                    <Icon className={cn("size-6", method.color)} />
                  </div>
                  <h3 className="text-base font-bold text-neutral-dark tracking-tight mb-1">{method.name}</h3>
                  <p className="text-xs text-neutral-medium mb-3">{method.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-medium">
                      <Clock className="size-3.5" />
                      <span className="font-semibold">{method.time}</span>
                    </div>
                    <span className="text-sm font-extrabold text-neutral-dark">{method.price}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Process steps */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-extrabold text-neutral-dark tracking-tight">Hogyan működik?</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-brand-cyan/20 to-transparent" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Rendelés leadása", desc: "Válaszd ki a termékeket és add le a rendelésed.", icon: CreditCard, color: "text-primary", bg: "bg-primary/10" },
                { step: "2", title: "Feldolgozás", desc: "Rendelésedet 24 órán belül feldolgozzuk és csomagoljuk.", icon: Package, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
                { step: "3", title: "Szállítás", desc: "A futárszolgálat átveszi és útnak indítja a csomagod.", icon: Truck, color: "text-brand-pink", bg: "bg-brand-pink/10" },
                { step: "4", title: "Kézbesítés", desc: "Megérkezik a csomagod a választott címre vagy automatába.", icon: MapPin, color: "text-emerald-600", bg: "bg-emerald-100" },
              ].map((item) => {
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

        {/* Trust + CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="size-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-dark tracking-tight">Biztonságos csomagolás</h3>
              <p className="text-xs text-neutral-medium mt-0.5">Minden terméket gondosan becsomagolunk, hogy épségben érkezzen meg.</p>
            </div>
          </div>
          <Link
            href="/termekek"
            className="group bg-gradient-to-r from-primary to-brand-cyan rounded-2xl p-6 flex items-center justify-between hover:shadow-lg transition-shadow"
          >
            <div>
              <h3 className="text-sm font-bold text-white">Vásárlás megkezdése</h3>
              <p className="text-xs text-white/80 mt-0.5">Böngéssz termékeink között!</p>
            </div>
            <ArrowRight className="size-5 text-white group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
