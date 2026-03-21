import type { Product, Category, BlogPost, Order } from "@/types";
import { shopifyProducts, shopifyCategories } from "./product-data";

// ─── Categories ─────────────────────────────────────────────────────────────
const LEGACY_MISC_CATEGORY_ID = "cat-egyeb";
const ACCESSORY_CATEGORY_ID = "cat-kiegeszitok";

const accessoryCategory: Category = {
  id: ACCESSORY_CATEGORY_ID,
  slug: "kiegeszitok",
  name: "Kiegészítők",
  description: "Utazási, autós és praktikus baba-mama kiegészítők",
  sortOrder: 9,
};

export const categories: Category[] = [
  ...shopifyCategories.filter((category) => category.id !== LEGACY_MISC_CATEGORY_ID),
  accessoryCategory,
];

// ─── Products ───────────────────────────────────────────────────────────────
function getCategoryOverrideBySlug(slug: string): string | null {
  const s = slug.toLowerCase();

  const securityKeywords = [
    "gyerekules",
    "autosules",
    "ulesmagasito",
    "isofix",
    "visszapillanto-tukor-autoba",
    "autosules-vedo",
    "biztonsagi-gyerekules",
  ];
  if (securityKeywords.some((keyword) => s.includes(keyword))) {
    return "cat-biztonsag";
  }

  const feedingKeywords = [
    "etetoszek",
    "cumisuveg",
    "cumitarto",
    "evoeszkoz",
    "tanyeralatet",
    "tanyer",
    "itato",
    "eteto",
    "eloke",
  ];
  if (feedingKeywords.some((keyword) => s.includes(keyword))) {
    return "cat-etetes";
  }

  const bathingKeywords = [
    "furdeto",
    "babakad",
    "vizhomero",
    "torolkozo",
    "mosdokesztyu",
  ];
  if (bathingKeywords.some((keyword) => s.includes(keyword))) {
    return "cat-furdetes";
  }

  if (s.includes("bebior")) {
    return "cat-babaszoba";
  }

  if (s.includes("pelenkazo-hatizsak") || s.includes("pelenkazo-taska")) {
    return "cat-pelenkak";
  }

  return null;
}

export const products: Product[] = shopifyProducts.map((product) => {
  const baseCategoryId =
    product.categoryId === LEGACY_MISC_CATEGORY_ID ? ACCESSORY_CATEGORY_ID : product.categoryId;
  const override = getCategoryOverrideBySlug(product.slug);
  const nextCategoryId = override ?? baseCategoryId;
  const nextCategoryIds = Array.from(
    new Set(
      (product.categoryIds ?? [product.categoryId])
        .map((categoryId) =>
          categoryId === LEGACY_MISC_CATEGORY_ID ? ACCESSORY_CATEGORY_ID : categoryId
        )
        .concat(nextCategoryId)
    )
  );

  return {
    ...product,
    categoryId: nextCategoryId,
    categoryIds: nextCategoryIds,
  };
});

const HIDDEN_STOREFRONT_CATEGORY_SLUGS = new Set(["babaruha", "egyeb"]);
const storefrontCategoryIdsWithActiveProducts = new Set(
  products.filter((product) => product.isActive).map((product) => product.categoryId)
);

export const storefrontCategories: Category[] = categories.filter(
  (category) =>
    !HIDDEN_STOREFRONT_CATEGORY_SLUGS.has(category.slug) &&
    storefrontCategoryIdsWithActiveProducts.has(category.id)
);

// Legacy mock products preserved for reference
const _legacyProducts: Product[] = [
  {
    id: "clpampers001",
    slug: "pampers-premium-care-pelenka",
    name: "Pampers Premium Care Pelenka",
    description:
      "A Pampers Premium Care pelenkák prémium minőségű nedvszívó réteggel rendelkeznek, amely akár 12 óráig is szárazon tartja a baba bőrét. Puha, légáteresztő anyagból készültek, ideálisak éjszakai használatra. Megfelelnek a legmagasabb bőrbarát minőségi követelményeknek.",
    shortDesc: "Prémium minőségű pelenka éjszakai használatra",
    price: 8990,
    salePrice: 6990,
    sku: "BO-1001",
    stock: 42,
    images: [
      "/images/products/pampers-premium-care-pelenka-1.jpg",
      "/images/products/pampers-premium-care-pelenka-2.jpg",
      "/images/products/pampers-premium-care-pelenka-3.jpg",
    ],
    categoryId: "clpelenkak001",
    tags: ["pelenka", "pampers", "éjszakai", "prémium"],
    weight: 2.5,
    rating: 4.8,
    reviewCount: 89,
    ageGroups: ["0-3 hónap", "3-6 hónap", "6-12 hónap"],
    isActive: true,
    isFeatured: true,
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-03-01T14:30:00.000Z",
  },
  {
    id: "clchicco002",
    slug: "chicco-babakocsi-sport",
    name: "Chicco Babakocsi Sport",
    description:
      "A Chicco Sport babakocsi könnyű, kompakt és könnyen összecsukható. Nagy kerekekkel rendelkezik, amelyek kiválóan teljesítenek minden terepen. A kényelmes ülés és a nagy kosár napi használatra ideális. Magyarországi garanciával.",
    shortDesc: "Könnyű sport babakocsi minden terepre",
    price: 89990,
    sku: "BO-1002",
    stock: 12,
    images: [
      "/images/products/chicco-babakocsi-sport-1.jpg",
      "/images/products/chicco-babakocsi-sport-2.jpg",
    ],
    categoryId: "clbabakocsi003",
    tags: ["babakocsi", "chicco", "sport", "kompakt"],
    weight: 12.5,
    rating: 4.6,
    reviewCount: 34,
    isActive: true,
    isFeatured: true,
    createdAt: "2024-02-01T09:00:00.000Z",
    updatedAt: "2024-03-05T11:20:00.000Z",
  },
  {
    id: "clavent003",
    slug: "avent-natural-cumisuveg-szett",
    name: "Avent Natural Cumisüveg Szett",
    description:
      "A Philips Avent Natural cumisüveg szett természetes szoptatásra optimalizált cumival rendelkezik. A széles nyakú üvegek könnyen tisztíthatók és tölthetők. A szett tartalmaz 4 db 260 ml-es üveget és 4 db közepes folyékony cumit. BPA-mentes anyagból készült.",
    shortDesc: "Természetes szoptatásra optimalizált cumisüveg szett",
    price: 12490,
    salePrice: 9990,
    sku: "BO-1003",
    stock: 28,
    images: [
      "/images/products/avent-natural-cumisuveg-szett-1.jpg",
      "/images/products/avent-natural-cumisuveg-szett-2.jpg",
      "/images/products/avent-natural-cumisuveg-szett-3.jpg",
    ],
    categoryId: "cletetes004",
    tags: ["cumisüveg", "avent", "szoptatás", "BPA-mentes"],
    weight: 0.8,
    rating: 4.9,
    reviewCount: 112,
    isActive: true,
    isFeatured: true,
    createdAt: "2024-01-20T08:00:00.000Z",
    updatedAt: "2024-02-28T16:45:00.000Z",
  },
  {
    id: "clbabybjorn004",
    slug: "babybjorn-pihenoszek",
    name: "BabyBjörn Pihenőszék",
    description:
      "A BabyBjörn Pihenőszék könnyű, hordozható és könnyen tisztítható. Ergonómiailag kialakított ülésfejlesztő, amely segíti a babát a fejlődésben. Színes, divatos dizájnokban kapható. A szék könnyen összecsukható és tárolható.",
    shortDesc: "Ergonómiai pihenőszék fejlődéshez",
    price: 45990,
    sku: "BO-1004",
    stock: 8,
    images: [
      "/images/products/babybjorn-pihenoszek-1.jpg",
      "/images/products/babybjorn-pihenoszek-2.jpg",
    ],
    categoryId: "clbiztonsag006",
    tags: ["pihenőszék", "babybjörn", "fejlődés", "ergonómia"],
    weight: 2.0,
    rating: 4.7,
    reviewCount: 56,
    isActive: true,
    isFeatured: false,
    createdAt: "2024-02-10T12:00:00.000Z",
    updatedAt: "2024-03-02T09:15:00.000Z",
  },
  {
    id: "clskiphop005",
    slug: "skip-hop-zoo-hatizsak",
    name: "Skip Hop Zoo Hátizsák",
    description:
      "A Skip Hop Zoo hátizsák színes állatos mintával és praktikus zsebekkel rendelkezik. Ideális kisgyerekeknek oviba vagy bölcsibe. Könnyű, vízálló anyagból készült. A cuki állatfigura a gyerekek kedvence.",
    shortDesc: "Cuki állatos hátizsák kisgyerekeknek",
    price: 8990,
    sku: "BO-1005",
    stock: 35,
    images: [
      "/images/products/skip-hop-zoo-hatizsak-1.jpg",
      "/images/products/skip-hop-zoo-hatizsak-2.jpg",
    ],
    categoryId: "cljatekok005",
    tags: ["hátizsák", "skip hop", "zoo", "oviba"],
    weight: 0.3,
    rating: 4.5,
    reviewCount: 23,
    isActive: true,
    isFeatured: false,
    createdAt: "2024-01-25T14:00:00.000Z",
    updatedAt: "2024-02-20T10:30:00.000Z",
  },
  {
    id: "clergobaby006",
    slug: "ergobaby-hordozokendo",
    name: "Ergobaby Hordozókendő",
    description:
      "Az Ergobaby hordozókendő ergonomikus hordozást biztosít, amely megfelelően támogatja a baba gerincét és csípőjét. Könnyen beállítható, kényelmes mind a szülőnek, mind a babának. Több hordozási pozícióban használható 0-4 éves korig.",
    shortDesc: "Ergonomikus hordozó 0-4 éves korig",
    price: 32990,
    salePrice: 27990,
    sku: "BO-1006",
    stock: 15,
    images: [
      "/images/products/ergobaby-hordozokendo-1.jpg",
      "/images/products/ergobaby-hordozokendo-2.jpg",
      "/images/products/ergobaby-hordozokendo-3.jpg",
    ],
    categoryId: "clbiztonsag006",
    tags: ["hordozó", "ergobaby", "ergonomikus", "baba"],
    weight: 0.6,
    rating: 4.8,
    reviewCount: 78,
    isActive: true,
    isFeatured: true,
    createdAt: "2024-01-08T11:00:00.000Z",
    updatedAt: "2024-03-04T13:00:00.000Z",
  },
  {
    id: "clmustela007",
    slug: "mustela-furdeto-szett",
    name: "Mustela Fürdető Szett",
    description:
      "A Mustela fürdető szett a csecsemők érzékeny bőrére lett kifejlesztve. A termékek természetes összetevőket tartalmaznak, pH-semleges formulával. A szett tartalmaz sampont, testápolót és fürdetőt. Dermatológiailag tesztelt, allergénmentes.",
    shortDesc: "Bőrbarát fürdető szett csecsemőknek",
    price: 7490,
    sku: "BO-1007",
    stock: 48,
    images: [
      "/images/products/mustela-furdeto-szett-1.jpg",
      "/images/products/mustela-furdeto-szett-2.jpg",
    ],
    categoryId: "clfurdetes007",
    tags: ["fürdetés", "mustela", "bőrbarát", "csecsemő"],
    weight: 0.5,
    rating: 4.6,
    reviewCount: 67,
    isActive: true,
    isFeatured: false,
    createdAt: "2024-02-05T09:30:00.000Z",
    updatedAt: "2024-02-25T15:20:00.000Z",
  },
  {
    id: "clhm008",
    slug: "hm-baba-body-szett-5db",
    name: "H&M Baba Body Szett 5db",
    description:
      "Az H&M baba body szett 5 db puha, pamut bodyt tartalmaz különböző színekben. Gombos zárás a vállnál, könnyű cserélhetőség. Napi használatra ideális, gyorsan szárad. 0-3 hónapos korig ajánlott.",
    shortDesc: "5 db pamut body szett csecsemőknek",
    price: 6990,
    ageGroups: ["0-3 hónap"],
    sku: "BO-1008",
    stock: 52,
    images: [
      "/images/products/hm-baba-body-szett-5db-1.jpg",
      "/images/products/hm-baba-body-szett-5db-2.jpg",
    ],
    categoryId: "clbabaruha002",
    tags: ["body", "H&M", "pamut", "csecsemő"],
    weight: 0.4,
    rating: 4.4,
    reviewCount: 41,
    isActive: true,
    isFeatured: false,
    createdAt: "2024-01-12T16:00:00.000Z",
    updatedAt: "2024-03-01T08:45:00.000Z",
  },
  {
    id: "clphilips009",
    slug: "philips-avent-bebior",
    name: "Philips Avent Bébiőr",
    description:
      "A Philips Avent bébiőr segíti a szülőket a baba alvási szokásainak nyomon követésében. Hőmérséklet- és páratartalom mérést végez, hang- és fényjelzéssel figyelmeztet. A digitális kijelző könnyen olvasható. Ideális ajándék várható szülőknek.",
    shortDesc: "Okos bébiőr hőmérséklet és páratartalom méréssel",
    price: 24990,
    salePrice: 19990,
    sku: "BO-1009",
    stock: 22,
    images: [
      "/images/products/philips-avent-bebior-1.jpg",
      "/images/products/philips-avent-bebior-2.jpg",
      "/images/products/philips-avent-bebior-3.jpg",
    ],
    categoryId: "clbabaszoba008",
    tags: ["bébiőr", "philips", "avent", "monitor"],
    weight: 0.3,
    rating: 4.7,
    reviewCount: 95,
    isActive: true,
    isFeatured: true,
    createdAt: "2024-01-18T13:00:00.000Z",
    updatedAt: "2024-02-29T12:00:00.000Z",
  },
  {
    id: "clnuk010",
    slug: "nuk-ragoka",
    name: "NUK Rágóka",
    description:
      "A NUK rágóka enyhíti a fogzási fájdalmat és ingert. Puha szilikonból készült, BPA-mentes. Különböző textúrák stimulálják az ínyet. Könnyen tisztítható, forralható. 0+ hónaptól használható.",
    shortDesc: "Fogzási rágóka BPA-mentes szilikonból",
    price: 2490,
    ageGroups: ["0-3 hónap", "3-6 hónap", "6-12 hónap"],
    sku: "BO-1010",
    stock: 67,
    images: [
      "/images/products/nuk-ragoka-1.jpg",
      "/images/products/nuk-ragoka-2.jpg",
    ],
    categoryId: "cletetes004",
    tags: ["rágóka", "NUK", "fogzás", "szilikon"],
    weight: 0.05,
    rating: 4.3,
    reviewCount: 18,
    isActive: true,
    isFeatured: false,
    createdAt: "2024-02-15T10:00:00.000Z",
    updatedAt: "2024-02-22T14:30:00.000Z",
  },
  {
    id: "clpampers011",
    slug: "pampers-aqua-pure-torlokendo",
    name: "Pampers Aqua Pure Törlőkendő",
    description:
      "A Pampers Aqua Pure törlőkendők 99% vizet tartalmaznak, minimális kémiai összetevőkkel. A baba érzékeny bőrére lettek kifejlesztve, illatmentesek és alkoholmentesek. Nagy csomagolás, gazdaságos használat. Dermatológiailag tesztelt.",
    shortDesc: "99% vizet tartalmazó törlőkendő érzékeny bőrre",
    price: 1990,
    sku: "BO-1011",
    stock: 89,
    images: [
      "/images/products/pampers-aqua-pure-torlokendo-1.jpg",
      "/images/products/pampers-aqua-pure-torlokendo-2.jpg",
    ],
    categoryId: "clpelenkak001",
    tags: ["törlőkendő", "pampers", "aqua pure", "bőrbarát"],
    weight: 0.8,
    rating: 4.9,
    reviewCount: 120,
    isActive: true,
    isFeatured: false,
    createdAt: "2024-01-05T08:00:00.000Z",
    updatedAt: "2024-03-06T11:00:00.000Z",
  },
  {
    id: "clmaxicosi012",
    slug: "maxi-cosi-autosules",
    name: "Maxi-Cosi Autósülés",
    description:
      "A Maxi-Cosi autósülés a legmagasabb biztonsági szabványoknak megfelel. Izofix rögzítéssel rendelkezik, könnyen telepíthető. 0-4 éves korig használható, háttal és arccal előre. Kiváló oldalütközés-védelmet nyújt.",
    shortDesc: "Izofix autósülés 0-4 éves korig",
    price: 69990,
    ageGroups: ["0-3 hónap", "3-6 hónap", "6-12 hónap", "1-2 év", "2-3 év", "3+ év"],
    salePrice: 59990,
    sku: "BO-1012",
    stock: 11,
    images: [
      "/images/products/maxi-cosi-autosules-1.jpg",
      "/images/products/maxi-cosi-autosules-2.jpg",
      "/images/products/maxi-cosi-autosules-3.jpg",
    ],
    categoryId: "clbiztonsag006",
    tags: ["autósülés", "maxi-cosi", "izofix", "biztonság"],
    weight: 8.5,
    rating: 4.9,
    reviewCount: 72,
    isActive: true,
    isFeatured: true,
    createdAt: "2024-01-22T15:00:00.000Z",
    updatedAt: "2024-03-03T09:30:00.000Z",
  },
];
void _legacyProducts;

// ─── Blog Posts ─────────────────────────────────────────────────────────────
export const blogPosts: BlogPost[] = [
  {
    id: "clblog001",
    slug: "babakocsi-valasztasi-utmutato",
    title: "Babakocsi választási útmutató: Melyik típus illik hozzátok a legjobban?",
    content: `A babakocsi az egyik legfontosabb beruházás a kisbaba érkezése előtt. A kínálat óriási: sportos, multifunkciós… De hogyan derítsd ki, hogy melyik való nektek?

Miért fontos a jó babakocsi kiválasztása?

Egy jól megválasztott babakocsi nemcsak a baba kényelmét és biztonságát szolgálja, hanem a szülők mindennapjait is megkönnyíti. Egy praktikus, strapabíró és könnyen kezelhető modell hosszú távon is hű társ lesz – városban, terepen, nyaraláskor vagy bevásárláskor. A rosszul választott babakocsi viszont sok bosszúságot okozhat: nehéz lehet tolni, összecsukni, vagy nem fér be az autó csomagtartójába. Ezért érdemes tudatosan dönteni és már akár a várandósság második trimeszterében elkezdeni kiválasztani a megfelelő modellt.

Milyen típusú babakocsik léteznek?

A piacon elérhető babakocsik különböző igényekhez igazodnak. Nézzük a leggyakoribb típusokat:

Klasszikus mózeskosaras babakocsi

A mózeskosaras babakocsi a legelső időszakban nyújt biztonságos megoldást, hiszen teljesen vízszintes fekvőfelületet biztosít a babának. Ez ideális a gerincnek és a légzésnek, ráadásul kényelmes és jól szellőzik. Általában 5–6 hónapos korig használható, amíg a baba önállóan nem ül.

Kinek ajánlott? Azoknak a szülőknek, akik szeretnék, ha újszülöttjük a legnagyobb kényelemben, klasszikus fekvőhelyen utazna, sok sétával a szabadban.

Multifunkciós babakocsi (2in1, 3in1, 4in1)

Ha egyetlen rendszerben szeretnétek mindent megkapni, a multifunkciós babakocsi a legjobb megoldás. Ezek a szettek tartalmazhatnak mózeskosarat, sportülést, sőt gyakran autóshordozót is. Így a babával együtt „nő" a babakocsi is és egészen 3 éves korig használható.

Előnyei: Minden egyben – újszülött kortól a kisgyermekévekig. Praktikus átalakíthatóság. Gazdaságos hosszú távon.

Tipp: Ha multifunkciós megoldást kerestek, a FreeON Fantasy 3in1 multifunkciós babakocsi praktikus és könnyen kezelhető választás. Még több kényelmet és tartozékot kínál a FreeON Bloom 4in1 multifunkciós babakocsi, amely hosszú évekre biztosít teljes körű megoldást.

Sportbabakocsi

A sportbabakocsi 6 hónapos kortól használható, amikor a baba már tud önállóan ülni. Könnyű, kompakt, és általában gyorsan összecsukható, így ideális utazásokhoz vagy városi ügyintézésekhez.

Előnyei: Könnyű váz, egyszerű kezelés. Kis helyen is elfér. Tökéletes társ mindennapi rohanásban.

Tipp: Ha sokat közlekedtek autóval vagy busszal, a FreeON Solo sport babakocsi könnyű váza nagy előny, a babakocsi súlya mindössze 6 kg. Elegáns, de praktikus választás a FreeON Unique sport babakocsi, míg a FreeON Simple sport babakocsi jó ár-érték arányban ideális a mindennapokra.

Iker- és testvérbabakocsi

Kis korkülönbségű testvérek vagy ikrek mellett nélkülözhetetlen a testvér- vagy ikerbabakocsi. Léteznek egymás melletti és egymás mögötti ülésekkel szerelt változatok, így mindenki megtalálhatja a számára kényelmesebb megoldást.

Kinek ajánlott? Azoknak, akiknek két kicsi gyermekük van, és egyszerre szeretnék őket biztonságosan és kényelmesen szállítani.

Mire figyelj még a babakocsi kiválasztásakor?

A megfelelő babakocsi kiválasztása nemcsak a baba kényelme, hanem a szülők mindennapi életének megkönnyítése miatt is fontos. A típus mellett az alábbi szempontokat is érdemes átgondolni:

Méret és súly – Ha gyakran utaztok autóval vagy tömegközlekedéssel, különösen fontos a babakocsi mérete és súlya. Egy könnyű, kompakt modell sok bosszúságtól kímél meg, hiszen egyszerűbb cipelni, beemelni a csomagtartóba vagy felvinni a lépcsőn. A nagyobb, robusztus kocsik stabilabbak lehetnek, de mindennapi használatnál a könnyű kezelhetőség gyakran előnyösebb.

Terepviszonyok – Nem mindegy, hol fogjátok a legtöbb időt sétával tölteni. Városi környezetben, sima járdákon a kisebb kerekek is elegendők, és a kompakt babakocsik gyorsabban manőverezhetők. Ha viszont gyakran mentek parkokba, erdőbe vagy egyenetlen talajra, érdemes strapabíróbb, nagyobb kerekekkel felszerelt modellt választani, amely jól veszi az akadályokat és rázkódásmentesebb utazást biztosít a babának.

Összecsukhatóság – A modern babakocsiknál alapkövetelmény az egyszerű összecsukhatóság. Ha sokszor kell autóba bepakolni, vagy gyakran szűk helyen kell tárolni, előnyös, ha egy kézzel, gyors mozdulattal összehajtható.

Kiegészítők – Bár apróságnak tűnhetnek, a babakocsi kiegészítők rengeteget számítanak a mindennapokban. Egy jól illeszkedő esővédő megkímél a váratlan záporoktól, a szúnyogháló nyáron óvja a babát a rovaroktól, a lábzsák vagy bundazsák pedig hideg időben biztosítja a meleget. Sok modellhez tartozékként járnak ezek, de előfordul, hogy külön kell beszerezni.

Na de akkor melyiket válaszd?

Nincs „tökéletes" babakocsi, csak olyan, amelyik a ti élethelyzetetekhez leginkább illik. Ha sokoldalúságot kerestek, a multifunkciós babakocsi a nyerő. Ha kis méret és könnyű kezelhetőség számít, válasszatok sportbabakocsit. Ha pedig két kicsi utazik veletek, az iker- és testvérbabakocsi lesz a megoldás.`,
    excerpt:
      "A babakocsi az egyik legfontosabb beruházás a kisbaba érkezése előtt. A kínálat óriási: sportos, multifunkciós… De hogyan derítsd ki, hogy melyik való nektek?",
    coverImage: "/babakocsi-valasztas-blog.png",
    author: "BabyOnline Szerkesztőség",
    tags: ["babakocsi", "vásárlási útmutató", "szülők", "tippek"],
    metaTitle: "Babakocsi választási útmutató - BabyOnline.hu",
    metaDescription:
      "Melyik babakocsi típus illik hozzátok a legjobban? Mózeskosaras, multifunkciós, sport- vagy ikerbabakocsi – segítünk a döntésben!",
    isPublished: true,
    publishedAt: "2026-03-01T10:00:00.000Z",
    aiGenerated: false,
    createdAt: "2026-03-01T09:00:00.000Z",
    updatedAt: "2026-03-01T10:00:00.000Z",
  },
  {
    id: "clblog002",
    slug: "vitaminok-terhesseg-alatt",
    title: "Vitaminok terhesség alatt: Melyek a legfontosabbak és miért?",
    content: `A várandósság időszaka az egyik legkülönlegesebb idő a nő életében – ilyenkor nemcsak a saját egészségünkre, hanem a kisbabánk fejlődésére is figyelnünk kell. A kiegyensúlyozott étrend alapvető, de bizonyos vitaminok és ásványi anyagok szerepe a terhesség alatt különösen fontos. Ezek segítik a baba egészséges fejlődését, a kismama jó közérzetét, és csökkenthetik a szövődmények kockázatát is.

De mely vitaminokra érdemes a legjobban odafigyelni, és miért nélkülözhetetlenek a terhesség kilenc hónapja során? Nézzük meg részletesen!

Folsav – a baba fejlődésének alapja

A folsav (B9-vitamin) a terhesség egyik legfontosabb vitaminja. Már a fogantatás előtti időszakban is ajánlott szedni, hiszen segíti a sejtosztódást és a velőcső záródását. A megfelelő folsavbevitel bizonyítottan csökkenti a fejlődési rendellenességek kockázatát.

Miért fontos? Segíti az idegrendszer és az agy egészséges fejlődését. Csökkenti a velőcsőzáródási rendellenességek esélyét. Fontos szerepe van a vörösvértestek képzésében.

Miben található? Spenót, brokkoli, hüvelyesek, citrusfélék, teljes kiőrlésű gabonák.

Vas – energia és vérképzés

A terhesség alatt a vérmennyiség akár 50%-kal is megnő, ezért a szervezetnek több vasra van szüksége. A vas hiánya vérszegénységhez, fáradtsághoz és a baba oxigénellátásának romlásához vezethet.

Miért fontos? Megelőzi a vashiányos vérszegénységet. Támogatja a baba oxigénellátását. Nélkülözhetetlen a vörösvértestek képződéséhez.

Miben található? Vörös hús, máj, tojás, lencse, spenót.

Kalcium – erős csontok és fogak

A baba csont- és fogfejlődése rengeteg kalciumot igényel, amit a szervezet elsősorban az anyától von el. Ha nincs elegendő kalciumbevitel, az a kismama csontozatát gyengítheti.

Miért fontos? Támogatja a baba csont- és fogfejlődését. Fontos az idegrendszer és az izmok működéséhez. Megakadályozhatja a kismamánál a csontritkulás korai kialakulását.

Miben található? Tej, sajt, joghurt, mandula, sötétzöld leveles zöldségek.

D-vitamin – napfényből és táplálékból

A D-vitamin segíti a kalcium felszívódását, ezért a terhesség alatt is kulcsszerepet játszik. Hiánya gyengítheti a csontokat, és növelheti bizonyos betegségek kockázatát.

Miért fontos? Elősegíti a kalcium beépülését a csontokba. Támogatja az immunrendszert. A baba egészséges csontozatához elengedhetetlen.

Miben található? Halak (pl. lazac, tonhal), tojássárgája, dúsított élelmiszerek, napfény hatására a bőrben termelődik.

Omega-3 zsírsavak – agy és szem fejlődéséhez

Az omega-3 zsírsavak nélkülözhetetlenek a baba idegrendszeri és látásfejlődéséhez.

Miért fontos? Segíti az agy és a szem egészséges fejlődését. Támogatja az idegrendszeri funkciókat. Pozitívan hathat a kognitív képességek alakulására.

Miben található? Tengeri halak, dió, lenmag, chiamag.

B12-vitamin – a vérképzés kulcsa

A B12-vitamin a folsavval együttműködve segíti a vérképzést és az idegrendszer működését. Vegetáriánus vagy vegán kismamáknak különösen oda kell figyelniük a pótlására.

Miért fontos? Megelőzi a vérszegénységet. Fontos az idegrendszeri fejlődéshez. Nélkülözhetetlen a DNS szintézishez.

Miben található? Hús, hal, tejtermékek, tojás.

Mire figyelj még?

A vitaminok szedését mindig beszéld meg az orvosoddal vagy védőnőddel. A túlzott vitaminbevitel veszélyes lehet, így kerüld az „önálló túladagolást". A változatos étrend a legjobb alap, a vitaminpótlás pedig kiegészítésként szolgáljon.

A terhesség alatt a vitaminok és ásványi anyagok kulcsszerepet játszanak mind a baba egészséges fejlődésében, mind a kismama jó közérzetében. A folsav, vas, kalcium, D-vitamin, omega-3 zsírsavak és B12-vitamin mind olyan tápanyagok, amelyekre különösen érdemes figyelni ebben az időszakban.

Egy kiegyensúlyozott étrend, a tudatos vitaminbevitel és a rendszeres orvosi konzultáció a legbiztosabb út ahhoz, hogy a várandósság hónapjai nyugodtan és egészségesen teljenek.

Fontos megjegyzés! A cikkben szereplő információk kizárólag általános tájékoztatásra szolgálnak, és nem helyettesítik az orvosi vizsgálatot, diagnózist vagy kezelést. A vitaminok és étrend-kiegészítők szedését minden esetben beszéld meg a kezelőorvosoddal vagy védőnőddel, hiszen az egyéni szükségletek eltérhetnek. A túlzott vitaminbevitel káros is lehet, ezért mindig kövesd az egészségügyi szakember útmutatását.`,
    excerpt:
      "A várandósság időszaka az egyik legkülönlegesebb idő a nő életében – ilyenkor nemcsak a saját egészségünkre, hanem a kisbabánk fejlődésére is figyelnünk kell.",
    coverImage: "/vitaminok-terhesseg-alatt.png",
    author: "BabyOnline Szerkesztőség",
    tags: ["terhesség", "vitaminok", "egészség", "kismama"],
    metaTitle: "Vitaminok terhesség alatt: Melyek a legfontosabbak? - BabyOnline.hu",
    metaDescription:
      "Folsav, vas, kalcium, D-vitamin, omega-3 és B12 – a legfontosabb vitaminok terhesség alatt. Tudj meg mindent a várandósság alatti vitaminpótlásról!",
    isPublished: true,
    publishedAt: "2026-03-05T10:00:00.000Z",
    aiGenerated: false,
    createdAt: "2026-03-05T09:00:00.000Z",
    updatedAt: "2026-03-05T10:00:00.000Z",
  },
  {
    id: "clblog003",
    slug: "furdetesi-kisokos-szuloknek",
    title: "Fürdetési kisokos szülőknek – minden, amit a baba fürdetéséről tudnod kell",
    content: `A fürdetés a babaápolás egyik legmeghatározóbb pillanata – nemcsak a tisztálkodásról szól, hanem a kötődés, megnyugvás és játék ideje is lehet. Legyen szó az első fürdetésről vagy az esti rutinná vált pancsolásról, fontos, hogy biztonságos, kényelmes és stresszmentes élményt biztosíts a kisbabád számára.

Miért fontos a fürdetés a napi rutin részeként?

A fürdetés nem csupán a tisztálkodásról szól, hanem egy szoros érzelmi kötődést megalapozó, meghitt időtöltés is. A rendszeres esti fürdés megnyugtatja a babát, segíti az elalvást, és előkészíti az éjszakai pihenésre. A napi fürdetési rutin kiszámíthatóságot, biztonságérzetet ad a babának, amely a fejlődő idegrendszer számára is fontos.

Sokan tapasztalják, hogy a fürdetés kifejezetten az apák kedvenc programja – ilyenkor külön időt tölthetnek a babával, kapcsolatot építenek, közösen nevetnek, pancsolnak. Ez a rendszeres „apa-baba idő" erősíti a családi köteléket és segíti a szülői szerep megerősödését.

Hogyan készülj a fürdetésre?

A legfontosabb, hogy minden kéznél legyen, mielőtt levetkőztetnéd a babát. Fürdetés közben nem hagyhatod egyedül – még egy pillanatra sem! Készítsd elő a kádat, törölközőt, pelenkát, testápolót, tiszta ruhát, mosdókesztyűt és egy meleg, huzatmentes helyiséget.

Tipp: Használj anatómiai babakádat, amely segít a baba kényelmes és biztonságos megtartásában. A megfelelő kádformázás megkönnyíti a szülők dolgát is.

Mi legyen a víz hőmérséklete?

A fürdővíz ideális hőmérséklete 36–37°C között van – hasonló a testhőmérséklethez. Ennél hidegebb vízben könnyen megfázhat a baba, a túl meleg pedig irritálhatja érzékeny bőrét.

Tipp: Ellenőrizd a hőfokot baba vízhőmérővel, például az Akuku szürke zsiráfos vízhőmérővel, ami pontosan mutatja a megfelelő hőmérsékletet, és jól illik bármilyen fürdőszobai környezetbe.

Hogyan tartsd biztonságosan a babát?

Az újszülött fürdetése során különösen fontos a biztonságos és helyes tartás, hiszen a baba még nem tudja megtartani egyedül a fejét. A fürdetés leggyakoribb és legbiztonságosabb módja az, ha a baba háton fekszik a szülő alkarján, miközben a feje a könyökhajlatban nyugszik, tekintete felfelé néz. Az azonos kézzel stabilan tartjuk a nyakat, a fejet és a hátat, így elkerülhető a hirtelen mozdulat vagy csúszás.

A másik kéz szabadon marad, így kényelmesen és óvatosan elvégezhető a fürdetés. A baba popsija és lábai a vízbe merülnek, miközben a feje mindig a víz felszíne felett marad. Ez a biztonságos baba fürdetési technika eleinte némi gyakorlatot igényel, de hamar rutinná válik, és segít abban, hogy a fürdetés egy nyugodt, kellemes élmény legyen mind a baba, mind a szülő számára.

Mivel mosd le a babát?

A babák bőre érzékeny, így kifejezetten gyengéd eszközökre van szükség. A hagyományos mosdókesztyűk vagy durvább szivacsok helyett válassz olyan puha alternatívákat, amelyek tisztítanak, de nem irritálnak.

Tipp: A New Baby szilikon fürdőkefe tökéletes választás – gyengéden tisztítja a baba bőrét, miközben segíti a vérkeringést, és kényelmes fogású a szülőknek is.

Hogyan töröld meg és öltöztesd fel a babát?

Fürdetés után azonnal csavard törölközőbe a babádat, törölgesd át, alaposan itasd fel a vizet a testéről, különösen ügyelve a hajlatokra, nyakra, fül mögötti részekre. A kapucnis törölközők különösen praktikusak, mivel megvédik a baba fejét is a kihűléstől.

Tipp: Válaszd a New Baby Basic frottír törölközőt kapucnival, ami puha, jól szívja a nedvességet, és ideális az esti fürdetésekhez is. Sőt, egy frottír mosdókesztyű is jár mellé!

Fürdetés = Kapcsolódás

A fürdetés egy különleges lehetőség az érzelmi kötődés elmélyítésére. A meleg víz, az érintések, a közösen töltött idő nemcsak a baba számára nyugtató, hanem a szülőknek is feltöltő lehet. A babák gyorsan megszokják és megszeretik a napi rutint, ha azt következetesen, szeretettel végezzük.

Ez az egyik olyan pillanat a napban, amikor nincs rohanás, nincs elintéznivaló, csak ti vagytok. Ezért sok szülő – különösen az apukák – számára igazi kedvenc esti program a fürdetés.

A biztonságos és kellemes baba fürdetéshez néhány egyszerű, de hasznos termék is nagy segítség lehet. Fontos, hogy a babád jól érezze magát, te pedig magabiztosan tudd elvégezni ezt a napi rutint. Legyen szó a megfelelő kádról, hőmérőről vagy puha törölközőről – nálunk mindent megtalálsz, ami ehhez szükséges!

Nézd meg a fürdetési termékeinket, és válaszd ki a számotokra legideálisabb darabokat a nyugodt, örömteli pillanatokhoz!`,
    excerpt:
      "A fürdetés a babaápolás egyik legmeghatározóbb pillanata – nemcsak a tisztálkodásról szól, hanem a kötődés, megnyugvás és játék ideje is lehet.",
    coverImage: "/furdetesi-kisokos.png",
    author: "BabyOnline Szerkesztőség",
    tags: ["fürdetés", "babaápolás", "tippek", "napi rutin", "baba"],
    metaTitle: "Fürdetési kisokos szülőknek - BabyOnline.hu",
    metaDescription:
      "Minden, amit a baba fürdetéséről tudnod kell: vízhőmérséklet, biztonságos tartás, eszközök és tippek a kellemes fürdetési rutinhoz.",
    isPublished: true,
    publishedAt: "2026-01-04T10:00:00.000Z",
    aiGenerated: false,
    createdAt: "2026-01-04T09:00:00.000Z",
    updatedAt: "2026-01-04T10:00:00.000Z",
  },
];

// ─── Mock Orders ────────────────────────────────────────────────────────────
export const mockOrders: Order[] = [
  {
    id: "ord-001",
    orderNumber: "BO-ABC123-XY",
    guestEmail: "vasarlo@example.com",
    status: "DELIVERED",
    items: [
      {
        id: "oi-001",
        productId: "clpampers001",
        productName: "Pampers Premium Care Pelenka",
        productImage: "/images/products/pampers-premium-care-pelenka-1.jpg",
        price: 6990,
        quantity: 2,
      },
    ],
    shippingAddress: {
      name: "Kovács János",
      email: "vasarlo@example.com",
      phone: "+36301234567",
      street: "Fő utca 1.",
      city: "Budapest",
      postalCode: "1011",
      country: "Magyarország",
    },
    billingAddress: {
      name: "Kovács János",
      street: "Fő utca 1.",
      city: "Budapest",
      postalCode: "1011",
      country: "Magyarország",
    },
    shippingMethod: "gls",
    shippingPrice: 0,
    subtotal: 13980,
    discount: 0,
    total: 13980,
    paymentMethod: "card",
    paymentStatus: "PAID",
    stripePaymentId: "pi_sim_xxx",
    glsTrackingId: "GLS-123456",
    createdAt: "2024-03-01T10:00:00.000Z",
    updatedAt: "2024-03-05T14:00:00.000Z",
  },
  {
    id: "ord-002",
    orderNumber: "BO-DEF456-ZW",
    guestEmail: "masik@example.com",
    status: "SHIPPED",
    items: [
      {
        id: "oi-002",
        productId: "clchicco002",
        productName: "Chicco Babakocsi Sport",
        productImage: "/images/products/chicco-babakocsi-sport-1.jpg",
        price: 89990,
        quantity: 1,
      },
    ],
    shippingAddress: {
      name: "Nagy Anna",
      email: "masik@example.com",
      phone: "+36209876543",
      street: "Kossuth Lajos u. 15.",
      city: "Debrecen",
      postalCode: "4025",
      country: "Magyarország",
    },
    billingAddress: {
      name: "Nagy Anna",
      street: "Kossuth Lajos u. 15.",
      city: "Debrecen",
      postalCode: "4025",
      country: "Magyarország",
    },
    shippingMethod: "gls",
    shippingPrice: 1490,
    subtotal: 89990,
    discount: 0,
    total: 91480,
    paymentMethod: "card",
    paymentStatus: "PAID",
    stripePaymentId: "pi_sim_yyy",
    glsTrackingId: "GLS-789012",
    createdAt: "2024-03-06T09:30:00.000Z",
    updatedAt: "2024-03-07T11:00:00.000Z",
  },
  {
    id: "ord-003",
    orderNumber: "BO-GHI789-QR",
    guestEmail: "harmadik@example.com",
    status: "PENDING",
    items: [
      {
        id: "oi-003",
        productId: "clavent003",
        productName: "Avent Natural Cumisüveg Szett",
        productImage: "/images/products/avent-natural-cumisuveg-szett-1.jpg",
        price: 9990,
        quantity: 1,
      },
    ],
    shippingAddress: {
      name: "Szabó Péter",
      email: "harmadik@example.com",
      phone: "+36701234567",
      street: "Petőfi Sándor u. 8.",
      city: "Szeged",
      postalCode: "6720",
      country: "Magyarország",
    },
    billingAddress: {
      name: "Szabó Péter",
      street: "Petőfi Sándor u. 8.",
      city: "Szeged",
      postalCode: "6720",
      country: "Magyarország",
    },
    shippingMethod: "magyar-posta",
    shippingPrice: 990,
    subtotal: 9990,
    discount: 0,
    total: 10980,
    paymentMethod: "card",
    paymentStatus: "PENDING",
    createdAt: "2024-03-08T14:00:00.000Z",
    updatedAt: "2024-03-08T14:00:00.000Z",
  },
];

// ─── Helper Functions ───────────────────────────────────────────────────────

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) return [];
  return products.filter((p) => p.categoryId === category.id);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.isFeatured);
}

export function getFeaturedProductsWithCategories(): (Product & {
  category?: Category;
})[] {
  return products
    .filter((p) => p.isFeatured)
    .map((p) => ({
      ...p,
      category: categories.find((c) => c.id === p.categoryId),
    }));
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function searchProducts(query: string, limit = 6): Product[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    )
    .slice(0, limit);
}
