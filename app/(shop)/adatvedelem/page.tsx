import { ShieldCheck, Mail } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default function AdatvedelemPage() {
  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Adatvédelmi szabályzat" },
          ]}
          className="mb-6"
        />

        {/* Hero */}
        <div className="relative rounded-2xl bg-gradient-to-r from-primary to-primary-light overflow-hidden p-6 md:p-10 mb-10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-white/30" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ShieldCheck className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Adatvédelmi szabályzat
              </h1>
              <p className="text-white/80 text-sm mt-1">Utolsó frissítés: 2026. március 1.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-10 space-y-8">
          <Section title="1. Adatkezelő">
            <div className="space-y-2">
              <p>Az adatkezelő adatai:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Cégnév: Kostyál Árpád e.v.</li>
                <li>Székhely: 4531 Nyírpazony, Hunyadi utca 6.</li>
                <li>Levelezési cím, panaszkezelés: 4531 Nyírpazony, Hunyadi utca 6.</li>
                <li>
                  E-mail:{" "}
                  <a href="mailto:hello@babyonline.hu" className="text-primary font-semibold hover:underline">
                    hello@babyonline.hu
                  </a>
                </li>
                <li>Telefonszám: 06202982228</li>
                <li>Weboldal: http://www.jatekonline.hu</li>
                <li>Nyilvántartásba vevő hatóság: NAV</li>
                <li>Nyilvántartási szám: 57916231</li>
                <li>Adószám: 59871370-1-35</li>
                <li>Képviselő: KOSTYÁL ÁRPÁD</li>
              </ul>
            </div>
          </Section>

          <Section title="2. Milyen adatokat gyűjtünk?">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Személyes adatok: név, e-mail cím, telefonszám, szállítási és számlázási cím.</li>
              <li>Rendelési adatok: megrendelt termékek, mennyiség, fizetési mód, rendelésszám.</li>
              <li>Technikai adatok: IP-cím, böngésző típusa, cookie-k, oldal-látogatottsági adatok.</li>
              <li>Hírlevéllel kapcsolatos adatok: e-mail cím, feliratkozás időpontja.</li>
            </ul>
          </Section>

          <Section title="3. Az adatkezelés célja és jogalapja">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Szerződés teljesítése:</strong> rendelés feldolgozása, szállítás, számlázás.</li>
              <li><strong>Jogszabályi kötelezettség:</strong> számviteli és adózási előírások betartása.</li>
              <li><strong>Jogos érdek:</strong> ügyfélszolgálat, weboldal fejlesztése, csalás megelőzése.</li>
              <li><strong>Hozzájárulás:</strong> hírlevél küldése, marketing célú megkeresés.</li>
            </ul>
          </Section>

          <Section title="4. Az adatkezelés időtartama">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Rendelési adatok: a számviteli törvényben előírt 8 évig.</li>
              <li>Hírlevél adatok: a leiratkozásig.</li>
              <li>Cookie adatok: a süti beállításoknak megfelelően, max. 1 évig.</li>
            </ul>
          </Section>

          <Section title="5. Adatfeldolgozók és adattovábbítás">
            <p>Az adataidat az alábbi partnerek számára továbbítjuk a szolgáltatás teljesítéséhez:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Szállítási szolgáltatók: GLS Hungary, Magyar Posta, Foxpost.</li>
              <li>Fizetési szolgáltató: Stripe (bankkártyás fizetés).</li>
              <li>Számlázás: Billingo.</li>
              <li>E-mail küldés: Resend.</li>
              <li>Analitika: Google Analytics, Vercel Analytics.</li>
            </ul>
          </Section>

          <Section title="6/A. Tárhelyszolgáltató">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Név: Hostinger International Ltd.</li>
              <li>Székhely: 61 Lordou Vironos st., 6023 Larnaca, Ciprus</li>
              <li>Elérhetőség: compliance@hostinger.com</li>
              <li>Weboldal: https://www.hostinger.com</li>
            </ul>
          </Section>

          <Section title="6. Az Ön jogai">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Hozzáférés joga:</strong> tájékoztatást kérhet a kezelt adatokról.</li>
              <li><strong>Helyesbítés joga:</strong> kérheti pontatlan adatainak javítását.</li>
              <li><strong>Törlés joga:</strong> kérheti személyes adatai törlését.</li>
              <li><strong>Adathordozhatóság joga:</strong> kérheti adatai géppel olvasható formátumban történő kiadását.</li>
              <li><strong>Tiltakozás joga:</strong> tiltakozhat az adatkezelés ellen.</li>
              <li><strong>Panasztétel joga:</strong> a Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH) panaszt tehet.</li>
            </ul>
          </Section>

          <Section title="7. Sütik (cookie-k)">
            <p>
              Weboldalunk sütiket használ a felhasználói élmény javítása és az analitikai mérések érdekében.
              A sütik beállításait bármikor módosíthatod a böngésződben. Részletes tájékoztatónkat a{" "}
              <a href="/sutik" className="text-primary font-semibold hover:underline">Süti szabályzat</a> oldalon találod.
            </p>
          </Section>

          <Section title="8. Kapcsolat">
            <p>
              Adatvédelmi kérdéseiddel fordulj hozzánk bizalommal:{" "}
              <a href="mailto:hello@babyonline.hu" className="text-primary font-semibold hover:underline">hello@babyonline.hu</a>
            </p>
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
