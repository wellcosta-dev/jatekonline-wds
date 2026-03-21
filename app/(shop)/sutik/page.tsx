import { Cookie } from "lucide-react";
import Script from "next/script";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default function SutikPage() {
  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Süti szabályzat" },
          ]}
          className="mb-6"
        />

        <div className="relative rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 overflow-hidden p-6 md:p-10 mb-10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-white/30" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Cookie className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Süti (Cookie) szabályzat
              </h1>
              <p className="text-white/80 text-sm mt-1">Utolsó frissítés: 2026. március 1.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-10 space-y-8">
          <Section title="Mi az a süti (cookie)?">
            <p>
              A sütik kis szöveges fájlok, amelyeket a weboldal a böngésződben tárol.
              Segítenek a weboldal működésében, a felhasználói élmény javításában és a látogatottsági adatok mérésében.
            </p>
          </Section>

          <Section title="Milyen sütiket használunk?">
            <div className="space-y-4 mt-2">
              <CookieType
                name="Szükséges sütik"
                desc="A weboldal alapvető működéséhez elengedhetetlenek (pl. kosár tartalma, bejelentkezési állapot). Ezek nélkül a weboldal nem tud megfelelően működni."
                duration="Munkamenet / 1 év"
              />
              <CookieType
                name="Analitikai sütik"
                desc="A weboldal látogatottságának mérésére és a felhasználói viselkedés elemzésére szolgálnak (Google Analytics 4, Google Tag Manager). Ezzel javítjuk weboldalunkat."
                duration="Max. 2 év"
              />
              <CookieType
                name="Marketing sütik"
                desc="Személyre szabott hirdetések megjelenítésére és a marketing kampányok hatékonyságának mérésére használjuk (Google Ads, Meta Pixel/Conversions API)."
                duration="Max. 1 év"
              />
              <CookieType
                name="Funkcionális sütik"
                desc="A felhasználói beállítások megjegyzésére szolgálnak (pl. nyelv, megjelenítési preferenciák)."
                duration="Max. 1 év"
              />
            </div>
          </Section>

          <Section title="Hogyan kezelheted a sütiket?">
            <p>
              A böngésződ beállításaiban bármikor letilthatod vagy törölheted a sütiket. A legtöbb böngészőben
              az „Adatvédelem" vagy „Beállítások" menüpontban találod a süti kezelési lehetőségeket.
              Fontos, hogy a sütik letiltása esetén a weboldal egyes funkciói korlátozottan működhetnek.
            </p>
            <p>
              A hozzájárulások kezelése Cookiebot CMP-n keresztül történik, és a Google Consent Mode v2 jeleit
              ennek megfelelően adjuk át a mérési rendszerek felé.
            </p>
          </Section>

          <Section title="Kapcsolat">
            <p>
              Sütikkel kapcsolatos kérdéseiddel fordulj hozzánk:{" "}
              <a href="mailto:hello@babyonline.hu" className="text-primary font-semibold hover:underline">hello@babyonline.hu</a>
            </p>
          </Section>

          <Section title="Süti nyilatkozat">
            <p>A részletes, automatikusan frissülő süti lista az alábbi blokkban érhető el:</p>
            <Script
              id="CookieDeclaration"
              src="https://consent.cookiebot.com/7d285d16-9001-408d-87f4-7febc70ff8c6/cd.js"
              type="text/javascript"
              strategy="afterInteractive"
              async
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-neutral-dark tracking-tight mb-3">{title}</h2>
      <div className="text-sm text-neutral-medium leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function CookieType({ name, desc, duration }: { name: string; desc: string; duration: string }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-sm font-bold text-neutral-dark tracking-tight">{name}</h3>
        <span className="text-[10px] font-semibold text-neutral-medium bg-gray-100 px-2 py-0.5 rounded-md">{duration}</span>
      </div>
      <p className="text-xs text-neutral-medium leading-relaxed">{desc}</p>
    </div>
  );
}
