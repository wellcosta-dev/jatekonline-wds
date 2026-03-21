import { FileText } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default function AszfPage() {
  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "ÁSZF" },
          ]}
          className="mb-6"
        />

        <div className="relative rounded-2xl bg-gradient-to-r from-neutral-dark to-neutral-dark/80 overflow-hidden p-6 md:p-10 mb-10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-white/30" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FileText className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Általános Szerződési Feltételek
              </h1>
              <p className="text-white/80 text-sm mt-1">Utolsó frissítés: 2026. március 1.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-10 space-y-8">
          <Section title="1. Általános rendelkezések">
            <p>
              Jelen Általános Szerződési Feltételek (ÁSZF) a BabyOnline.hu webáruház és a vásárló
              (a továbbiakban: Vásárló) közötti jogviszonyt szabályozzák. A webáruház használatával
              a Vásárló elfogadja a jelen ÁSZF-ben foglalt feltételeket.
            </p>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mt-3">
              <p className="font-semibold text-neutral-dark mb-2">A szolgáltató adatai</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Cégnév: Kostyál Árpád e.v.</li>
                <li>Székhely: 4531 Nyírpazony, Hunyadi utca 6.</li>
                <li>Levelezési cím, panaszkezelés: 4531 Nyírpazony, Hunyadi utca 6.</li>
                <li>E-mail: hello@babyonline.hu</li>
                <li>Telefonszám: 06202982228</li>
                <li>Weboldal: http://www.jatekonline.hu</li>
                <li>Nyilvántartásba vevő hatóság: NAV</li>
                <li>Nyilvántartási szám: 57916231</li>
                <li>Adószám: 59871370-1-35</li>
                <li>Képviselő: KOSTYÁL ÁRPÁD</li>
              </ul>
            </div>
          </Section>

          <Section title="2. Megrendelés menete">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>A Vásárló a kiválasztott termékeket kosárba helyezi, majd megadja szállítási és számlázási adatait.</li>
              <li>A rendelés leadásával a Vásárló ajánlatot tesz a termékek megvásárlására.</li>
              <li>A szerződés a rendelés visszaigazolásával jön létre, amelyet e-mailben küldünk meg.</li>
              <li>Az árak magyar forintban (HUF) értendők, az ÁFA-t tartalmazzák.</li>
            </ul>
          </Section>

          <Section title="3. Árak és fizetés">
            <p>
              A termékek ára a termékoldalon feltüntetett bruttó ár. A szállítási költség a pénztárnál kerül kiszámításra.
              20 000 Ft feletti rendelésnél a szállítás ingyenes. Elfogadott fizetési módok: bankkártya (Visa, Mastercard) és utánvét (+500 Ft kezelési díj).
            </p>
          </Section>

          <Section title="4. Szállítás">
            <p>
              A szállítás GLS futárszolgálat (1-2 munkanap), Magyar Posta (2-4 munkanap) vagy Foxpost csomagautomata (1-3 munkanap) útján történik.
              A szállítási határidők tájékoztató jellegűek, a tényleges szállítási idő eltérhet.
            </p>
          </Section>

          <Section title="5. Elállási jog">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>A Vásárló a termék kézhezvételétől számított 30 napon belül indoklás nélkül elállhat a szerződéstől.</li>
              <li>Az elállási szándékot írásban (e-mail) kell jelezni a hello@babyonline.hu címen.</li>
              <li>A terméket eredeti, sértetlen állapotban kell visszaküldeni.</li>
              <li>A visszatérítés a termék visszaérkezésétől számított 5 munkanapon belül történik.</li>
              <li>Higiéniai termékek bontott állapotban nem küldhetők vissza.</li>
            </ul>
          </Section>

          <Section title="6. Jótállás és szavatosság">
            <p>
              A termékekre a magyar jogszabályok szerinti jótállási és szavatossági feltételek vonatkoznak.
              Hibás termék esetén kérjük, vegyék fel velünk a kapcsolatot a hello@babyonline.hu címen.
            </p>
          </Section>

          <Section title="7. Adatvédelem">
            <p>
              A személyes adatok kezelésére vonatkozó részletes tájékoztatás az{" "}
              <a href="/adatvedelem" className="text-primary font-semibold hover:underline">Adatvédelmi szabályzat</a> oldalon olvasható.
            </p>
          </Section>

          <Section title="8. Panaszkezelés">
            <p>
              Panaszait a hello@babyonline.hu e-mail címen, vagy a 06202982228 telefonszámon jelezheti.
              A panaszokat 30 napon belül írásban megválaszoljuk. Vitás esetben a területileg illetékes
              békéltető testülethez vagy a bírósághoz fordulhat.
            </p>
          </Section>

          <Section title="9. Záró rendelkezések">
            <p>
              A jelen ÁSZF-ben nem szabályozott kérdésekben a Polgári Törvénykönyv, a fogyasztóvédelemről szóló törvény
              és az elektronikus kereskedelemre vonatkozó jogszabályok rendelkezései az irányadók.
              Az ÁSZF módosításait a weboldalon tesszük közzé.
            </p>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mt-3">
              <p className="font-semibold text-neutral-dark mb-2">Tárhelyszolgáltató</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Név: Hostinger International Ltd.</li>
                <li>Székhely: 61 Lordou Vironos st., 6023 Larnaca, Ciprus</li>
                <li>Elérhetőség: compliance@hostinger.com</li>
                <li>Weboldal: https://www.hostinger.com</li>
              </ul>
            </div>
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
