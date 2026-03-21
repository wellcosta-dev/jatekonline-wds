import { categories } from "@/lib/mock-data";
import type { BlogPost } from "@/types";

export interface SeoInternalLink {
  title: string;
  href: string;
  description: string;
}

export interface CategorySeoContent {
  intro: string;
  tips: string[];
  internalLinks: SeoInternalLink[];
  faqs?: { question: string; answer: string }[];
}

export interface CategoryTipsLandingContent {
  title: string;
  intro: string;
  sections: { title: string; body: string }[];
  faqs: { question: string; answer: string }[];
}

const CATEGORY_SEO_MAP: Record<string, Omit<CategorySeoContent, "internalLinks">> = {
  pelenkak: {
    intro:
      "Fedezd fel pelenka kínálatunkat, ahol az újszülött kortól a totyogó méretig minőségi, bőrbarát megoldásokat találsz. Olyan termékeket válogattunk, amelyek kényelmet adnak a babának és egyszerűbbé teszik a mindennapokat.",
    tips: [
      "Válassz súly szerinti méretet a szivárgásmentes illeszkedéshez.",
      "Érzékeny bőr esetén illatanyag- és alkoholmentes terméket keress.",
      "Nappali és éjszakai használatra külön típus is hasznos lehet.",
    ],
    faqs: [
      {
        question: "Melyik pelenkaméretet válasszam?",
        answer: "A baba aktuális testsúlyához igazodj, és ha szivárgást tapasztalsz, válts eggyel nagyobb méretre.",
      },
      {
        question: "Mikor érdemes éjszakai pelenkát használni?",
        answer: "Ha éjszaka gyakori az átázás, a magasabb nedvszívású éjszakai típus segít nyugodtabb alvásban.",
      },
    ],
  },
  babakocsi: {
    intro:
      "Babakocsi kategóriánkban könnyű sport, multifunkciós és mindennapi használatra tervezett modellek közül választhatsz. A kényelmes kezelhetőség, biztonság és tartósság szerint szűrtük össze a kínálatot.",
    tips: [
      "Nézd meg az összecsukási méretet, ha sokat utaztok autóval.",
      "Városi használathoz a fordulékony, könnyű váz a legpraktikusabb.",
      "Terepre nagyobb kerék és jobb rugózás ad kényelmesebb utazást.",
    ],
    faqs: [
      {
        question: "Újszülöttnek milyen babakocsi a legjobb?",
        answer: "Teljesen dönthető vagy mózeskosaras megoldás ajánlott, ami megfelelő alátámasztást ad.",
      },
      {
        question: "Milyen súlyú babakocsi praktikus mindennapra?",
        answer: "Városi használatnál a könnyebb, kompakt modellek kényelmesebbek emeléshez és szállításhoz.",
      },
    ],
  },
  etetes: {
    intro:
      "Etetés kategóriánkban cumisüvegek, etetőszékek és praktikus kiegészítők segítik a nyugodt napi rutint. Olyan termékeket találsz, amelyek higiénikusak, tartósak és könnyen tisztíthatók.",
    tips: [
      "BPA-mentes, bababarát anyagú termékeket válassz.",
      "A könnyen szétszedhető kialakítás tisztításkor sok időt spórol.",
      "Életkorhoz illesztett etetési eszközökkel kényelmesebb a használat.",
    ],
    faqs: [
      {
        question: "Mikortól érdemes etetőszéket használni?",
        answer: "Amikor a baba stabilan ül, jellemzően 6 hónapos kortól, mindig egyéni fejlődés szerint.",
      },
      {
        question: "Mit jelent, hogy BPA-mentes?",
        answer: "A termék nem tartalmaz Biszfenol-A vegyületet, ami babaetetési eszközöknél fontos szempont.",
      },
    ],
  },
  biztonsag: {
    intro:
      "A biztonság kategóriában autósüléseket, otthoni és utazási védelmi termékeket találsz. Kínálatunkat úgy állítottuk össze, hogy a baba védelme mellett a szülők kényelmét is támogassa.",
    tips: [
      "Autósülésnél mindig ellenőrizd a méret- és súlytartományt.",
      "ISOFIX kompatibilitás esetén gyorsabb és stabilabb a rögzítés.",
      "Otthoni biztonsági eszközöknél a tanúsítványokra is figyelj.",
    ],
    faqs: [
      {
        question: "ISOFIX nélkül is biztonságos az autósülés?",
        answer: "Igen, megfelelő öves rögzítéssel biztonságos lehet, de az ISOFIX csökkenti a hibás bekötés esélyét.",
      },
      {
        question: "Mikor kell autósülést váltani?",
        answer: "Ha a gyermek kinövi a magasság- vagy súlyhatárt, a következő méretkategóriára kell váltani.",
      },
    ],
  },
  furdetes: {
    intro:
      "Fürdetés kategóriánk segít a napi esti rutin kényelmes és biztonságos kialakításában. Babakádak, vízhőmérők és puha textíliák között válogathatsz a baba érzékeny bőréhez igazítva.",
    tips: [
      "Az ideális vízhőmérséklet 36-37 C, ezt mindig ellenőrizd.",
      "Puha, bőrbarát törölközővel és kiegészítőkkel csökkenthető az irritáció.",
      "A csúszásmentes, stabil kialakítás növeli a biztonságot.",
    ],
    faqs: [
      {
        question: "Milyen gyakran érdemes fürdetni az újszülöttet?",
        answer: "Napi rövid esti rutin elegendő lehet, de mindig figyelj a baba bőrének állapotára.",
      },
      {
        question: "Mekkora vízhőfok az ideális?",
        answer: "Általában 36-37 C közötti hőmérséklet ajánlott babafürdetéshez.",
      },
    ],
  },
  babaszoba: {
    intro:
      "Babaszoba kategóriánkban kiságyak, matracok és praktikus kiegészítők segítik a nyugodt alvási környezet kialakítását. Olyan termékeket találsz, amelyek hosszú távon is kényelmesek és biztonságosak.",
    tips: [
      "A kiságy méretét és a matrac kompatibilitását együtt ellenőrizd.",
      "A légáteresztő anyagok segítik a komfortos alvási környezetet.",
      "A könnyen tisztítható huzatok napi szinten praktikusak.",
    ],
  },
  jatekok: {
    intro:
      "Játék kategóriánkban fejlesztő és szórakoztató termékeket találsz különböző életkorokra. A kínálatot a biztonság, tartósság és fejlődést támogató funkciók alapján válogattuk.",
    tips: [
      "Válassz életkorhoz illesztett játékot a biztonságos használatért.",
      "A többfunkciós játékok hosszabb ideig lekötik a figyelmet.",
      "Mindig ellenőrizd a tisztíthatóságot és az anyagminőséget.",
    ],
  },
  babaruha: {
    intro:
      "Babaruha kategóriánk puha, kényelmes és könnyen kezelhető darabokat kínál a mindennapokra. A praktikusság és bőrbarát anyaghasználat elsődleges szempont volt a válogatásnál.",
    tips: [
      "A réteges öltöztetéshez rugalmas alapdarabokat válassz.",
      "A patentos, könnyen nyitható modellek gyorsabb pelenkázást tesznek lehetővé.",
      "Mosásálló, puha anyagokkal hosszabb távon is jó választás marad.",
    ],
  },
  egyeb: {
    intro:
      "Az egyéb kategóriában olyan hasznos kiegészítőket találsz, amelyek a napi baba-mama rutint teszik kényelmesebbé. Praktikus, jól kombinálható termékek egy helyen.",
    tips: [
      "A napi rutinhoz igazodva válassz hordozható, multifunkciós kiegészítőket.",
      "Érdemes a legtöbbet használt termékeket készleten tartani otthon.",
      "A könnyű tisztíthatóság és tartósság itt is kulcstényező.",
    ],
  },
};

function buildDefaultInternalLinks(currentSlug?: string): SeoInternalLink[] {
  const preferred = ["babakocsi", "pelenkak", "etetes", "biztonsag", "furdetes"];
  return preferred
    .filter((slug) => slug !== currentSlug)
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter(Boolean)
    .slice(0, 3)
    .map((category) => ({
      title: category!.name,
      href: `/kategoriak/${category!.slug}`,
      description: category!.description ?? "Népszerű kategória a BabyOnline kínálatából.",
    }));
}

export function getCategorySeoContent(slug: string, categoryName: string): CategorySeoContent {
  const mapped = CATEGORY_SEO_MAP[slug];
  const internalLinks = buildDefaultInternalLinks(slug);

  if (!mapped) {
    return {
      intro: `${categoryName} kategóriánkban gondosan válogatott, baba-mama fókuszú termékeket találsz. Szűrőinkkel gyorsan megtalálhatod az élethelyzetetekhez legjobban illő megoldásokat.`,
      tips: [
        "Használd az ár, készlet és értékelés szűrőket a gyorsabb választáshoz.",
        "Olvasd el a termékleírásokat és véleményeket vásárlás előtt.",
        "Kombinálj több kategóriát, hogy teljes szettet állíts össze.",
      ],
      internalLinks,
    };
  }

  return {
    ...mapped,
    internalLinks,
  };
}

export function getCollectionInternalLinks(): SeoInternalLink[] {
  return [
    {
      title: "Akciós termékek",
      href: "/akciok",
      description: "Nézd meg az aktuális kedvezményeket és kiemelt ajánlatokat.",
    },
    {
      title: "Újdonságok",
      href: "/ujdonsagok",
      description: "Frissen érkezett termékek a legújabb baba-mama trendek szerint.",
    },
    {
      title: "Blog tanácsok",
      href: "/blog",
      description: "Vásárlási útmutatók és hasznos tippek egy helyen.",
    },
  ];
}

const CATEGORY_TIPS_MAP: Record<string, CategoryTipsLandingContent> = {
  babakocsi: {
    title: "Babakocsi vásárlási útmutató",
    intro:
      "Ebben az útmutatóban összefoglaltuk, mire figyelj babakocsi választásnál, hogy hosszú távon is kényelmes, biztonságos és praktikus döntést hozz.",
    sections: [
      {
        title: "1. Életmód és használati környezet",
        body:
          "Városi használathoz a könnyű, jól manőverezhető modellek a legjobbak, míg vegyes terepre stabilabb váz és nagyobb kerekek ajánlottak.",
      },
      {
        title: "2. Összecsukhatóság és méret",
        body:
          "Ha gyakran autóztok, ellenőrizd az összecsukott méretet és a tömeget. A gyors, egykezes csukás jelentős napi kényelmet ad.",
      },
      {
        title: "3. Kényelem és biztonság",
        body:
          "Állítható háttámla, stabil fékrendszer és megfelelő övrendszer nélkülözhetetlen. Fontos a jó szellőzés és a mosható textil is.",
      },
    ],
    faqs: [
      {
        question: "Milyen babakocsi kell újszülöttnek?",
        answer:
          "Újszülöttnél teljesen dönthető vagy mózeses megoldás ajánlott, mert ez támogatja a megfelelő fekvőpozíciót.",
      },
      {
        question: "Mikor érdemes sportbabakocsira váltani?",
        answer:
          "Amikor a baba stabilan ül, általában 6 hónapos kor körül, de ez egyéni fejlődéstől is függ.",
      },
      {
        question: "Milyen kereket válasszak városi használatra?",
        answer:
          "Jellemzően kisebb, fordulékony kerekek praktikusak, de rosszabb burkolaton a közepes-méretű kerék ad jobb komfortot.",
      },
    ],
  },
  pelenkak: {
    title: "Pelenka választási útmutató",
    intro:
      "A megfelelő pelenka kényelmet ad a babának és nyugodtabb napirendet a családnak. Az alábbi szempontok segítenek a gyors választásban.",
    sections: [
      {
        title: "1. Méret és illeszkedés",
        body:
          "Mindig a baba aktuális súlya alapján válassz méretet. A túl nagy pelenka szivároghat, a túl kicsi pedig kényelmetlen lehet.",
      },
      {
        title: "2. Nedvszívás és bőrbarát anyag",
        body:
          "Érzékeny bőrhöz illatanyag- és alkoholmentes, dermatológiailag tesztelt termékeket érdemes előnyben részesíteni.",
      },
      {
        title: "3. Nappali és éjszakai rutin",
        body:
          "Hosszabb alváshoz magasabb nedvszívású pelenka lehet praktikus. Napközben a könnyű fel- és levétel a legfontosabb.",
      },
    ],
    faqs: [
      {
        question: "Milyen gyakran cseréljek pelenkát?",
        answer:
          "Általában 2-4 óránként, illetve széklet után azonnal. Mindig figyeld a baba komfortját és bőrének állapotát.",
      },
      {
        question: "Honnan látom, hogy kicsi a pelenka?",
        answer:
          "Nyomásnyomok, gyakori szivárgás vagy kényelmetlen mozgás esetén érdemes nagyobb méretre váltani.",
      },
      {
        question: "Mikor érdemes éjszakai pelenkát használni?",
        answer:
          "Ha gyakori az átázás vagy megszakad az alvás, éjszakára nagyobb nedvszívású típus javasolt.",
      },
    ],
  },
};

export function getCategoryTipsLandingContent(
  slug: string,
  categoryName: string
): CategoryTipsLandingContent {
  const mapped = CATEGORY_TIPS_MAP[slug];
  if (mapped) return mapped;

  return {
    title: `${categoryName} vásárlási útmutató`,
    intro:
      "Összegyűjtöttük a legfontosabb szempontokat, amelyek segítenek gyorsan és tudatosan választani a kategória termékei közül.",
    sections: [
      {
        title: "1. Alap igények meghatározása",
        body:
          "Először azt döntsd el, milyen gyakran és milyen helyzetben használod a terméket, mert ez segít leszűkíteni a kínálatot.",
      },
      {
        title: "2. Minőség és biztonság",
        body:
          "Termékleírás, anyagösszetétel és felhasználói értékelések alapján válassz, különösen baba bőrrel érintkező termékeknél.",
      },
      {
        title: "3. Ár-érték és hosszú táv",
        body:
          "Nem mindig a legolcsóbb opció a legjobb. Érdemes a tartósságot és a mindennapi használhatóságot is figyelembe venni.",
      },
    ],
    faqs: [
      {
        question: `Mire figyeljek ${categoryName.toLowerCase()} vásárlásakor?`,
        answer:
          "A használati gyakoriságra, a minőségre és a baba életkorához illeszkedő paraméterekre érdemes fókuszálni.",
      },
      {
        question: "Hogyan válasszak a sok termék közül?",
        answer:
          "Használd a szűrőket ár, értékelés és készlet alapján, majd hasonlítsd össze a top 2-3 jelöltet.",
      },
      {
        question: "Melyik a legjobb ár-érték arányú választás?",
        answer:
          "Az, amelyik stabil minőséget ad a napi használatban, és a legfontosabb igényeidnek kompromisszumok nélkül megfelel.",
      },
    ],
  };
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function getBlogFunnelLinks(input: {
  title: string;
  tags: string[];
  content: string;
}): SeoInternalLink[] {
  const haystack = `${input.title} ${input.tags.join(" ")} ${input.content}`.toLowerCase();

  if (includesAny(haystack, ["babakocsi", "sportkocsi", "mózes", "mozes"])) {
    return [
      {
        title: "Babakocsi témagyűjtő",
        href: "/blog/temak/vasarlasi-utmutatok",
        description: "Babakocsi és választási útmutatók egy oldalon.",
      },
      {
        title: "Babakocsi kategória",
        href: "/kategoriak/babakocsi",
        description: "Válogass a könnyű, multifunkciós és városi modellek között.",
      },
      {
        title: "Babakocsi tippek",
        href: "/kategoriak/babakocsi/tippek",
        description: "Részletes ellenőrzőlista és gyakori kérdések vásárlás előtt.",
      },
      {
        title: "Biztonságos utazás",
        href: "/kategoriak/biztonsag",
        description: "Autósülések és utazási kiegészítők a nyugodt közlekedéshez.",
      },
    ];
  }

  if (includesAny(haystack, ["vitamin", "terhess", "kismama", "varand", "várand"])) {
    return [
      {
        title: "Kismama témagyűjtő",
        href: "/blog/temak/kismama-es-varandossag",
        description: "Várandósság alatti tippek és praktikus cikkek összegyűjtve.",
      },
      {
        title: "Etetés kategória",
        href: "/kategoriak/etetes",
        description: "Praktikus etetési megoldások újszülött kortól.",
      },
      {
        title: "Fürdetés kategória",
        href: "/kategoriak/furdetes",
        description: "Mindennapi babaápolási rutinhoz válogatott termékek.",
      },
      {
        title: "Babaápolási témák",
        href: "/blog/temak/babaapolas-es-napi-rutin",
        description: "Napi rutin és gondozási tippek friss cikkekkel.",
      },
    ];
  }

  if (includesAny(haystack, ["fürdet", "furdet", "higién", "higien", "bőrápol", "borapol"])) {
    return [
      {
        title: "Babaápolás témagyűjtő",
        href: "/blog/temak/babaapolas-es-napi-rutin",
        description: "Fürdetés, rutin és higiénia cikkek egy helyen.",
      },
      {
        title: "Fürdetési termékek",
        href: "/kategoriak/furdetes",
        description: "Kádak, törölközők és fürdetési kiegészítők egy helyen.",
      },
      {
        title: "Fürdetés tippek",
        href: "/kategoriak/furdetes/tippek",
        description: "Gyakorlati fürdetési útmutató lépésről lépésre.",
      },
      {
        title: "Pelenkák",
        href: "/kategoriak/pelenkak",
        description: "Bőrbarát pelenkák és alapvető higiéniai termékek.",
      },
    ];
  }

  return [
    {
      title: "Blog témák",
      href: "/blog/temak",
      description: "Intent alapú cikkgyűjtő oldalak gyors áttekintéssel.",
    },
    {
      title: "Népszerű kategóriák",
      href: "/kategoriak",
      description: "Fedezd fel a legkeresettebb baba-mama termékkategóriákat.",
    },
    {
      title: "Akciós ajánlatok",
      href: "/akciok",
      description: "Spórolj kedvezményes termékekkel kompromisszumok nélkül.",
    },
    {
      title: "Összes termék",
      href: "/termekek",
      description: "Szűrj ár, értékelés és készlet alapján a gyors döntéshez.",
    },
  ];
}

export interface BlogIntentLandingDefinition {
  slug: string;
  title: string;
  description: string;
  intro: string;
  focusKeywords: string[];
  faqs: { question: string; answer: string }[];
}

const BLOG_INTENT_LANDINGS: BlogIntentLandingDefinition[] = [
  {
    slug: "vasarlasi-utmutatok",
    title: "Vásárlási útmutatók szülőknek",
    description:
      "Gyakorlati vásárlási útmutatók babakocsi, napi rutin és baba-mama termék választáshoz.",
    intro:
      "Ezen az oldalon a legjobb vásárlási útmutatóinkat gyűjtöttük össze, hogy gyorsabban és magabiztosabban tudj dönteni a baba-mama termékek között.",
    focusKeywords: ["vásárlási útmutató", "útmutató", "választási", "babakocsi", "tippek"],
    faqs: [
      {
        question: "Melyik útmutatóval érdemes kezdeni?",
        answer:
          "Először azt a témát válaszd, ami a következő hetekben aktuális nálatok, így azonnal hasznosítható tanácsokat kapsz.",
      },
      {
        question: "Mennyire frissülnek ezek az útmutatók?",
        answer:
          "A cikkeket rendszeresen felülvizsgáljuk, hogy a termékkínálathoz és a szülői igényekhez igazodjanak.",
      },
    ],
  },
  {
    slug: "kismama-es-varandossag",
    title: "Kismama és várandósság tippek",
    description:
      "Várandósság alatti vitaminok, napi rutin és hasznos tanácsok kismamáknak egy helyen.",
    intro:
      "A várandósság időszakában különösen fontos a hiteles, könnyen követhető útmutatás. Itt kismamáknak szóló, gyakorlatias cikkeket találsz.",
    focusKeywords: ["terhess", "várand", "kismama", "vitamin", "egészség"],
    faqs: [
      {
        question: "Ez a tartalom helyettesíti az orvosi tanácsadást?",
        answer:
          "Nem, a cikkek tájékoztató jellegűek. Minden egészségügyi kérdésben egyeztess kezelőorvosoddal vagy védőnőddel.",
      },
      {
        question: "Milyen gyakran kerülnek fel új cikkek?",
        answer:
          "Rendszeresen bővítjük a témát szezonális és élethelyzet alapú útmutatókkal.",
      },
    ],
  },
  {
    slug: "babaapolas-es-napi-rutin",
    title: "Babaápolás és napi rutin cikkek",
    description:
      "Fürdetés, higiénia és mindennapi babaápolási rutin tippek kezdő és gyakorló szülőknek.",
    intro:
      "A kiszámítható napi rutin biztonságot ad a babának és nyugalmat a családnak. Ezek a cikkek a gyakorlati kivitelezésben segítenek.",
    focusKeywords: ["fürdet", "babaápol", "higién", "napi rutin", "bőr"],
    faqs: [
      {
        question: "Melyik babaápolási cikk a legfontosabb indulásnak?",
        answer:
          "A napi rutin és a fürdetés témájú anyagok általában gyorsan alkalmazható, gyakorlati lépéseket adnak.",
      },
      {
        question: "Hogyan találok kapcsolódó termékeket a cikkekhez?",
        answer:
          "A cikkoldalakon és témagyűjtő oldalakon belső linkek vezetnek releváns kategóriákhoz és termékekhez.",
      },
    ],
  },
];

export function getBlogIntentLandingDefinitions(): BlogIntentLandingDefinition[] {
  return BLOG_INTENT_LANDINGS;
}

export function getBlogIntentLandingBySlug(
  slug: string
): BlogIntentLandingDefinition | undefined {
  return BLOG_INTENT_LANDINGS.find((item) => item.slug === slug);
}

export function getBlogPostsForIntent(posts: BlogPost[], intentSlug: string): BlogPost[] {
  const intent = getBlogIntentLandingBySlug(intentSlug);
  if (!intent) return [];

  const normalizedKeywords = intent.focusKeywords.map((kw) => kw.toLowerCase());
  return posts.filter((post) => {
    const haystack = `${post.title} ${post.tags.join(" ")} ${post.content.slice(0, 800)}`.toLowerCase();
    return normalizedKeywords.some((keyword) => haystack.includes(keyword));
  });
}

const CATEGORY_TO_INTENT: Record<string, string> = {
  babakocsi: "vasarlasi-utmutatok",
  pelenkak: "vasarlasi-utmutatok",
  etetes: "kismama-es-varandossag",
  furdetes: "babaapolas-es-napi-rutin",
  babaszoba: "kismama-es-varandossag",
  biztonsag: "vasarlasi-utmutatok",
};

export function getCategoryAutomationLinks(categorySlug: string): SeoInternalLink[] {
  const links: SeoInternalLink[] = [
    {
      title: "Blog témák",
      href: "/blog/temak",
      description: "Cikkek élethelyzet és vásárlási szándék szerint rendezve.",
    },
    {
      title: "Kategória áttekintés",
      href: `/kategoriak/${categorySlug}`,
      description: "Nézd meg a teljes kínálatot szűrhető listában.",
    },
  ];

  const mappedIntent = CATEGORY_TO_INTENT[categorySlug];
  if (mappedIntent) {
    const intent = getBlogIntentLandingBySlug(mappedIntent);
    if (intent) {
      links.push({
        title: intent.title,
        href: `/blog/temak/${intent.slug}`,
        description: intent.description,
      });
    }
  }

  return links.slice(0, 3);
}

export function getBlogIntentAutomationLinks(intentSlug: string): SeoInternalLink[] {
  if (intentSlug === "vasarlasi-utmutatok") {
    return [
      {
        title: "Babakocsi tippek",
        href: "/kategoriak/babakocsi/tippek",
        description: "Részletes választási ellenőrzőlista babakocsi vásárláshoz.",
      },
      {
        title: "Pelenka tippek",
        href: "/kategoriak/pelenkak/tippek",
        description: "Méretválasztás és napi rutin tanácsok röviden.",
      },
      {
        title: "Összes termék",
        href: "/termekek",
        description: "Teljes kínálat szűrőkkel és gyors összehasonlítással.",
      },
    ];
  }

  if (intentSlug === "kismama-es-varandossag") {
    return [
      {
        title: "Etetés kategória",
        href: "/kategoriak/etetes",
        description: "Praktikus etetési termékek újszülött kortól.",
      },
      {
        title: "Babaszoba kategória",
        href: "/kategoriak/babaszoba",
        description: "Kényelmes és rendezett környezet kialakításához.",
      },
      {
        title: "Blog főoldal",
        href: "/blog",
        description: "Minden cikk egy helyen, időrendben.",
      },
    ];
  }

  return [
    {
      title: "Fürdetés tippek",
      href: "/kategoriak/furdetes/tippek",
      description: "Fürdetési rutin és gyakori kérdések röviden összefoglalva.",
    },
    {
      title: "Fürdetés kategória",
      href: "/kategoriak/furdetes",
      description: "Fürdetési eszközök és kiegészítők válogatva.",
    },
    {
      title: "Pelenkák",
      href: "/kategoriak/pelenkak",
      description: "Higiéniai alaptermékek mindennapi használatra.",
    },
  ];
}
