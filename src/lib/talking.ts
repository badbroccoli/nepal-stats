import type { NewsItem } from "./types";
import type { TrendItem } from "./connectors/trends";

export interface TalkTerm {
  text: string;
  weight: number;
  /** Relative 0–1 for sizing */
  score: number;
  kind: "trend" | "news" | "both";
  sources: string[];
}

export interface TalkingNow {
  terms: TalkTerm[];
  sourceCount: number;
  headlineCount: number;
  trendCount: number;
  generatedAt: string;
  method: string;
}

const EN_STOP = new Set(
  `a an the and or but if in on at to for of as is was are were be been being
  this that these those it its with from by into over after before about
  between through during without within against among under above
  not no nor so than then too very can could should would will just
  also only own same such other each few more most other some such
  what when where which who whom why how all any both each few more
  nepal nepali nepalese news live update updates today yesterday says
  say said after before amid year years day days week weeks month months
  new first second government govt people city district province`.split(/\s+/),
);

const NP_STOP = new Set(
  `र को का कि मा छ हो पनि भएको गरे कोही सबै यो त्यो लागिबाट संग देखि
  पछि अघि भने भन्छन् भएको छन् थियो हुने गर्ने गरेका गरेको
  नेपाल नेपाली आज हिजो भोलि समाचार खबर अपडेट`.split(/\s+/),
);

/** High-signal entities / topics that show up in Nepali discourse. */
const ENTITY_BOOST: Record<string, number> = {
  kathmandu: 1.4,
  काठमाडौं: 1.4,
  काठमाण्डौ: 1.4,
  pokhara: 1.25,
  पोखरा: 1.25,
  oli: 1.35,
  "kp oli": 1.4,
  देउवा: 1.3,
  deuba: 1.3,
  congress: 1.2,
  कांग्रेस: 1.25,
  "maoist": 1.2,
  माओवादी: 1.25,
  uml: 1.2,
  एमाले: 1.25,
  parliament: 1.2,
  संसद: 1.25,
  remittance: 1.3,
  विप्रेषण: 1.3,
  nepse: 1.35,
  नेप्से: 1.35,
  forex: 1.2,
  nrb: 1.25,
  earthquake: 1.4,
  भूकम्प: 1.4,
  flood: 1.35,
  बाढी: 1.35,
  landslide: 1.35,
  पहिरो: 1.35,
  monsoon: 1.25,
  मनसुन: 1.25,
  aqi: 1.2,
  tourism: 1.15,
  पर्यटन: 1.2,
  everest: 1.3,
  सगरमाथा: 1.3,
  hydro: 1.2,
  hydropower: 1.25,
  विद्युत्: 1.2,
  corruption: 1.25,
  भ्रष्टाचार: 1.3,
  budget: 1.2,
  बजेट: 1.25,
  indian: 1.1,
  india: 1.1,
  china: 1.1,
  चीन: 1.15,
  भारत: 1.15,
  weather: 1.1,
  मौसम: 1.2,
  fuel: 1.15,
  पेट्रोल: 1.2,
  gold: 1.1,
  सुन: 1.15,
};

function normalizeToken(raw: string): string | null {
  let t = raw.trim();
  t = t.replace(/^[^A-Za-z0-9\u0900-\u097F]+|[^A-Za-z0-9\u0900-\u097F]+$/g, "");
  if (!t) return null;

  const isDev = /[\u0900-\u097F]/.test(t);
  if (isDev) {
    if (t.length < 2) return null;
    if (NP_STOP.has(t)) return null;
    return t;
  }

  const lower = t.toLowerCase();
  if (lower.length < 3) return null;
  if (EN_STOP.has(lower)) return null;
  if (/^\d+(\.\d+)?$/.test(lower)) return null;
  return lower;
}

function tokenize(text: string): string[] {
  const cleaned = text
    .replace(/<[^>]+>/g, " ")
    .replace(/[“”"']/g, "")
    .replace(/[|/\\—–-]+/g, " ");
  const parts = cleaned.split(/[\s,;:!?.()[\]{}]+/).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const n = normalizeToken(p);
    if (n) out.push(n);
  }
  // English bigrams for entities like "kp oli"
  for (let i = 0; i < out.length - 1; i++) {
    const a = out[i];
    const b = out[i + 1];
    if (!/[\u0900-\u097F]/.test(a) && !/[\u0900-\u097F]/.test(b)) {
      const bi = `${a} ${b}`;
      if (ENTITY_BOOST[bi]) out.push(bi);
    }
  }
  return out;
}

function displayForm(token: string): string {
  if (/[\u0900-\u097F]/.test(token)) return token;
  return token
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type Acc = {
  weight: number;
  sources: Set<string>;
  trend: boolean;
  news: boolean;
};

export function buildTalkingNow(
  news: NewsItem[],
  trends: TrendItem[],
): TalkingNow {
  const acc = new Map<string, Acc>();

  const bump = (
    token: string,
    weight: number,
    source: string,
    kind: "trend" | "news",
  ) => {
    const boost = ENTITY_BOOST[token] ?? 1;
    const w = weight * boost;
    const cur = acc.get(token) ?? {
      weight: 0,
      sources: new Set<string>(),
      trend: false,
      news: false,
    };
    cur.weight += w;
    cur.sources.add(source);
    if (kind === "trend") cur.trend = true;
    if (kind === "news") cur.news = true;
    acc.set(token, cur);
  };

  for (const trend of trends) {
    const traffic = Math.max(200, trend.traffic);
    // Log scale so 20k doesn't totally dominate
    const base = 18 + Math.log10(traffic) * 14;
    for (const tok of tokenize(trend.title)) {
      bump(tok, base, "Google Trends NP", "trend");
    }
    for (const rel of trend.related) {
      for (const tok of tokenize(rel)) {
        bump(tok, base * 0.35, "Google Trends NP", "trend");
      }
    }
  }

  for (const item of news) {
    const ageH =
      (Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000;
    const freshness = ageH < 6 ? 1.25 : ageH < 24 ? 1 : 0.7;
    const corpus = `${item.title} ${item.summary ?? ""}`;
    for (const tok of tokenize(corpus)) {
      bump(tok, 8 * freshness, item.source, "news");
    }
  }

  const ranked = [...acc.entries()]
    .map(([token, v]) => ({
      text: displayForm(token),
      weight: v.weight,
      score: 0,
      kind: (v.trend && v.news
        ? "both"
        : v.trend
          ? "trend"
          : "news") as TalkTerm["kind"],
      sources: [...v.sources].slice(0, 6),
    }))
    .filter((t) => t.weight >= 10)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 48);

  const maxW = ranked[0]?.weight ?? 1;
  for (const t of ranked) t.score = t.weight / maxW;

  const sourceSet = new Set<string>();
  for (const n of news) sourceSet.add(n.source);
  if (trends.length) sourceSet.add("Google Trends NP");

  return {
    terms: ranked,
    sourceCount: sourceSet.size,
    headlineCount: news.length,
    trendCount: trends.length,
    generatedAt: new Date().toISOString(),
    method:
      "Weighted keywords from Google Trends (Nepal) + live Nepali newsroom RSS. Platforms without public APIs (Instagram, TikTok, Facebook, X) are not scraped.",
  };
}
