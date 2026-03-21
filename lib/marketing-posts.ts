export type SocialPlatform = "Facebook" | "Instagram";
export type PostFormat = "Reel" | "Carousel" | "Image Post" | "Story";
export type ConversionGoal =
  | "Traffic"
  | "Purchase"
  | "Lead"
  | "Retargeting"
  | "Engagement";

export interface MarketingPostIdea {
  id: number;
  platform: SocialPlatform;
  format: PostFormat;
  goal: ConversionGoal;
  topic: string;
  headline: string;
  caption: string;
  creativeBrief: string;
  cta: string;
  hashtags: string[];
}

interface TopicConfig {
  topic: string;
  angle: string;
  value: string;
  proof: string;
  urgency: string;
  cta: string;
  hashtags: string[];
}

const HOOKS = [
  "A legtobb szulo itt vesziti el a penzet",
  "Ezt a 3 hibat ne kovess el vasarlas elott",
  "Ha most varandosos vagy, ezt mentsd el",
  "A termek, amit minden nap halas leszel, hogy megvettel",
  "Igy valassz 10 perc alatt biztosra",
  "Egy egyszeru csere, ami sok ideget megsporol",
  "Amit a valodi vasarloink imadnak benne",
  "Ha fontos a kenyelem es a biztonsag, ezt olvasd el",
  "Ne a legolcsobbat keresd, ezt keresd helyette",
  "Igy lesz konnyebb a mindennapi rutin",
  "Mielott rendelsz, ezt nezd meg",
  "Ezert eri meg most lepni",
  "Top valasztas szuloktol, nem veletlenul",
  "A praktikum, ami tenyleg mukodik",
  "Napi 2 perc, es maris jobb lesz a rutin",
  "A problema, amire ez ad valodi megoldast",
  "Igy lesz nyugodtabb a napod",
  "A kis reszlet, ami nagy kulonbseget jelent",
  "Mit valassz, ha hosszu tavra tervezel",
  "Ez a poszt konnyen megsporolhat egy rossz vasarlast",
] as const;

const TOPICS: TopicConfig[] = [
  {
    topic: "Babakocsi",
    angle: "konnyu iranyithatosag es gyors osszecsukas",
    value: "kevesebb stressz seta, bevasarlas es utazas kozben",
    proof: "sokan az elso het utan mar ezt nevezik a legjobb dontesuknek",
    urgency: "A legnepszerubb modellek gyorsan fogynak.",
    cta: "Nezd meg a babakocsi kinalatot",
    hashtags: ["#babakocsi", "#babarutin", "#szulotippek"],
  },
  {
    topic: "Etetes",
    angle: "gyors tisztithatosag es baba-barat anyagok",
    value: "nyugodtabb etetes es kevesebb napi pakolas",
    proof: "a visszatero rendelesek nagy resze ebbol a kategoriabol jon",
    urgency: "Most tobb nepszeru etetesi termek akcios.",
    cta: "Valassz etetesi termeket most",
    hashtags: ["#etetes", "#babaetetes", "#anyukakelete"],
  },
  {
    topic: "Furdetes",
    angle: "biztonsagos tartas es komfortos furdetesi rutin",
    value: "kevesebb panik, tobb nyugodt esti pillanat",
    proof: "sok csaladnal ez lett az esti rutin kedvenc resze",
    urgency: "A szezonalis furdetesi csomagok korlatozott darabszamban elerhetok.",
    cta: "Fedezd fel a furdetesi termekeket",
    hashtags: ["#furdetes", "#babaapolas", "#estirutin"],
  },
  {
    topic: "Biztonsag",
    angle: "stabil rogzites es megbizhato hasznalat",
    value: "nagyobb nyugalom utazasnal es otthon is",
    proof: "a vasarloi velemenyekben ez az egyik leggyakoribb pozitivum",
    urgency: "A top biztonsagi termekeknel gyakori a keszlethiany.",
    cta: "Nezd meg a biztonsagi kategoriat",
    hashtags: ["#biztonsag", "#autosules", "#szuloknek"],
  },
  {
    topic: "Pelenkazas",
    angle: "borbarat megoldas es praktikus mindennapi hasznalat",
    value: "kevesebb kellemetlenseg, nyugodtabb baba",
    proof: "a vasarloink tobbsege ujrarendeli ezeket a termekeket",
    urgency: "Most erdemes betarazni, mert valtozo a keszlet.",
    cta: "Rendeld meg a pelenkazasi alapokat",
    hashtags: ["#pelenka", "#babaellatas", "#babamama"],
  },
];

const GOALS: ConversionGoal[] = [
  "Traffic",
  "Purchase",
  "Lead",
  "Retargeting",
  "Engagement",
];

const FORMATS: PostFormat[] = ["Reel", "Carousel", "Image Post", "Story"];
const PLATFORMS: SocialPlatform[] = ["Facebook", "Instagram"];

function buildCaption(hook: string, topic: TopicConfig, idx: number): string {
  return `${hook}.\n\n${topic.topic} tematika, ${topic.angle} fókusszal. Ez konkretan azt adja, hogy ${topic.value}.\n\nMiert mukodik? ${topic.proof}. ${topic.urgency}\n\nTip: mentsd el ezt a posztot, hogy vasarlas elott biztosra menj.\n\n#${idx + 1} konverzios otlet`;
}

export const marketingPostIdeas: MarketingPostIdea[] = HOOKS.flatMap((hook, hookIdx) =>
  TOPICS.map((topic, topicIdx) => {
    const id = hookIdx * TOPICS.length + topicIdx + 1;
    return {
      id,
      platform: PLATFORMS[id % PLATFORMS.length],
      format: FORMATS[id % FORMATS.length],
      goal: GOALS[id % GOALS.length],
      topic: topic.topic,
      headline: `${topic.topic}: ${hook}`,
      caption: buildCaption(hook, topic, id - 1),
      creativeBrief: `Mutasd be 3 gyors pontban az elonyt (${topic.angle}), egy valos elethelyzettel, majd tedd ra a CTA-t a vizual vegen.`,
      cta: topic.cta,
      hashtags: [...topic.hashtags, "#babyonline", "#webshop"],
    };
  })
);
