import { Ruler } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { cn } from "@/lib/utils";

const CLOTHING_SIZES = [
  { size: "50", age: "0-1 hó", height: "46-50 cm", weight: "3-4 kg" },
  { size: "56", age: "1-2 hó", height: "51-56 cm", weight: "4-5 kg" },
  { size: "62", age: "2-4 hó", height: "57-62 cm", weight: "5-6 kg" },
  { size: "68", age: "4-6 hó", height: "63-68 cm", weight: "6-8 kg" },
  { size: "74", age: "6-9 hó", height: "69-74 cm", weight: "8-10 kg" },
  { size: "80", age: "9-12 hó", height: "75-80 cm", weight: "10-11 kg" },
  { size: "86", age: "12-18 hó", height: "81-86 cm", weight: "11-13 kg" },
  { size: "92", age: "18-24 hó", height: "87-92 cm", weight: "13-14 kg" },
  { size: "98", age: "2-3 év", height: "93-98 cm", weight: "14-16 kg" },
  { size: "104", age: "3-4 év", height: "99-104 cm", weight: "16-18 kg" },
];

const SHOE_SIZES = [
  { eu: "16", age: "0-3 hó", length: "9.5 cm" },
  { eu: "17", age: "3-6 hó", length: "10.2 cm" },
  { eu: "18", age: "6-9 hó", length: "10.8 cm" },
  { eu: "19", age: "9-12 hó", length: "11.5 cm" },
  { eu: "20", age: "12-15 hó", length: "12.2 cm" },
  { eu: "21", age: "15-18 hó", length: "12.8 cm" },
  { eu: "22", age: "18-21 hó", length: "13.5 cm" },
  { eu: "23", age: "21-24 hó", length: "14.2 cm" },
  { eu: "24", age: "2-2.5 év", length: "14.8 cm" },
  { eu: "25", age: "2.5-3 év", length: "15.5 cm" },
];

const DIAPER_SIZES = [
  { size: "1 (Newborn)", weight: "2-5 kg", desc: "Újszülött" },
  { size: "2 (Mini)", weight: "3-6 kg", desc: "1-3 hónapos" },
  { size: "3 (Midi)", weight: "4-9 kg", desc: "3-6 hónapos" },
  { size: "4 (Maxi)", weight: "7-14 kg", desc: "6-12 hónapos" },
  { size: "5 (Junior)", weight: "11-18 kg", desc: "12-24 hónapos" },
  { size: "6 (Extra Large)", weight: "15+ kg", desc: "2 év felett" },
];

export default function MerettablazatPage() {
  return (
    <div className="min-h-screen bg-neutral-pale">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <Breadcrumb
          items={[
            { label: "Főoldal", href: "/" },
            { label: "Mérettáblázat" },
          ]}
          className="mb-6"
        />

        <div className="relative rounded-2xl bg-gradient-to-r from-brand-pink to-secondary overflow-hidden p-6 md:p-10 mb-10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-white/30" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Ruler className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Mérettáblázat
              </h1>
              <p className="text-white/80 text-sm mt-1">Segítség a megfelelő méret kiválasztásához</p>
            </div>
          </div>
        </div>

        {/* Clothing */}
        <div className="mb-8">
          <h2 className="text-lg font-extrabold text-neutral-dark tracking-tight mb-4">Babaruha méretek</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-bold text-xs text-neutral-dark/70 uppercase tracking-wider">Méret</th>
                    <th className="text-left px-4 py-3 font-bold text-xs text-neutral-dark/70 uppercase tracking-wider">Kor</th>
                    <th className="text-left px-4 py-3 font-bold text-xs text-neutral-dark/70 uppercase tracking-wider">Magasság</th>
                    <th className="text-left px-4 py-3 font-bold text-xs text-neutral-dark/70 uppercase tracking-wider">Súly</th>
                  </tr>
                </thead>
                <tbody>
                  {CLOTHING_SIZES.map((row, i) => (
                    <tr key={row.size} className={cn("border-b border-gray-50 last:border-0", i % 2 === 0 && "bg-primary-pale/10")}>
                      <td className="px-4 py-2.5 font-bold text-primary">{row.size}</td>
                      <td className="px-4 py-2.5 text-neutral-dark">{row.age}</td>
                      <td className="px-4 py-2.5 text-neutral-medium">{row.height}</td>
                      <td className="px-4 py-2.5 text-neutral-medium">{row.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Shoes */}
        <div className="mb-8">
          <h2 className="text-lg font-extrabold text-neutral-dark tracking-tight mb-4">Babacipő méretek</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-bold text-xs text-neutral-dark/70 uppercase tracking-wider">EU méret</th>
                    <th className="text-left px-4 py-3 font-bold text-xs text-neutral-dark/70 uppercase tracking-wider">Kor</th>
                    <th className="text-left px-4 py-3 font-bold text-xs text-neutral-dark/70 uppercase tracking-wider">Talphossz</th>
                  </tr>
                </thead>
                <tbody>
                  {SHOE_SIZES.map((row, i) => (
                    <tr key={row.eu} className={cn("border-b border-gray-50 last:border-0", i % 2 === 0 && "bg-brand-cyan/5")}>
                      <td className="px-4 py-2.5 font-bold text-brand-cyan">{row.eu}</td>
                      <td className="px-4 py-2.5 text-neutral-dark">{row.age}</td>
                      <td className="px-4 py-2.5 text-neutral-medium">{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Diapers */}
        <div className="mb-8">
          <h2 className="text-lg font-extrabold text-neutral-dark tracking-tight mb-4">Pelenka méretek</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-bold text-xs text-neutral-dark/70 uppercase tracking-wider">Méret</th>
                    <th className="text-left px-4 py-3 font-bold text-xs text-neutral-dark/70 uppercase tracking-wider">Súly</th>
                    <th className="text-left px-4 py-3 font-bold text-xs text-neutral-dark/70 uppercase tracking-wider">Ajánlott kor</th>
                  </tr>
                </thead>
                <tbody>
                  {DIAPER_SIZES.map((row, i) => (
                    <tr key={row.size} className={cn("border-b border-gray-50 last:border-0", i % 2 === 0 && "bg-brand-pink/5")}>
                      <td className="px-4 py-2.5 font-bold text-brand-pink">{row.size}</td>
                      <td className="px-4 py-2.5 text-neutral-dark">{row.weight}</td>
                      <td className="px-4 py-2.5 text-neutral-medium">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <p className="text-xs text-amber-700 leading-relaxed">
            A mérettáblázatok tájékoztató jellegűek. A babák fejlődése egyedi, ezért az adatok eltérhetnek.
            Kérdés esetén keress minket: <a href="mailto:hello@babyonline.hu" className="font-semibold hover:underline">hello@babyonline.hu</a>
          </p>
        </div>
      </div>
    </div>
  );
}
