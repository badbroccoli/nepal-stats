import { XMLParser } from "fast-xml-parser";
import type { NewsItem } from "../types";
import { cachedFetch } from "./cache";

/** Live RSS feeds that respond reliably from this environment. */
const FEEDS: { source: string; url: string }[] = [
  { source: "OnlineKhabar", url: "https://www.onlinekhabar.com/feed" },
  { source: "OnlineKhabar EN", url: "https://english.onlinekhabar.com/feed" },
  {
    source: "Nagarik",
    url: "https://nagariknews.nagariknetwork.com/feed",
  },
  { source: "Setopati", url: "https://www.setopati.com/feed" },
  { source: "Ratopati", url: "https://www.ratopati.com/feed" },
  { source: "Kathmandu Post", url: "https://kathmandupost.com/rss" },
  {
    source: "Himalayan Times",
    url: "https://thehimalayantimes.com/rssFeed/24",
  },
  { source: "Nepali Times", url: "https://www.nepalitimes.com/feed" },
  {
    source: "Annapurna Express",
    url: "https://theannapurnaexpress.com/rss",
  },
  { source: "Annapurna Post", url: "https://annapurnapost.com/rss" },
  { source: "BBC Nepali", url: "https://feeds.bbci.co.uk/nepali/rss.xml" },
  { source: "Khabarhub", url: "https://khabarhub.com/feed" },
  { source: "Bizmandu", url: "https://bizmandu.com/feed" },
  { source: "Clickmandu", url: "https://clickmandu.com/feed" },
  { source: "ICIMOD", url: "https://www.icimod.org/feed" },
];

const PER_SOURCE = 5;
const MAX_ITEMS = 60;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

function asArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

async function parseFeed(
  source: string,
  url: string,
): Promise<NewsItem[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "NepalStatsDashboard/1.0 (+https://github.com/badbroccoli/nepal-stats)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel ?? doc?.feed;
  const items = asArray(channel?.item ?? channel?.entry);

  return items.slice(0, 12).map((item, idx) => {
    const link =
      typeof item.link === "string"
        ? item.link
        : item.link?.href ?? item.guid?.["#text"] ?? item.guid ?? "#";
    const title =
      typeof item.title === "string"
        ? item.title
        : item.title?.["#text"] ?? "Untitled";
    const published =
      item.pubDate ?? item.published ?? item.updated ?? new Date().toISOString();
    const summary =
      typeof item.description === "string"
        ? item.description.replace(/<[^>]+>/g, "").slice(0, 180)
        : undefined;
    const publishedAt = new Date(published);
    return {
      id: `${source}-${idx}-${link}`.slice(0, 180),
      title: String(title).trim(),
      link: String(link),
      source,
      publishedAt: Number.isNaN(publishedAt.getTime())
        ? new Date().toISOString()
        : publishedAt.toISOString(),
      summary,
    } satisfies NewsItem;
  });
}

/** Prefer source diversity, then recency — avoids a single outlet dominating. */
function diversify(items: NewsItem[]): NewsItem[] {
  const bySource = new Map<string, NewsItem[]>();
  for (const item of items) {
    const list = bySource.get(item.source) ?? [];
    list.push(item);
    bySource.set(item.source, list);
  }
  for (const list of bySource.values()) {
    list.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  }

  const picked: NewsItem[] = [];
  const seen = new Set<string>();
  const sources = [...bySource.keys()];

  for (let round = 0; round < PER_SOURCE; round++) {
    for (const source of sources) {
      const item = bySource.get(source)?.[round];
      if (!item) continue;
      const key = item.link || item.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      picked.push(item);
      if (picked.length >= MAX_ITEMS) return picked;
    }
  }

  const rest = items
    .filter((i) => !seen.has(i.link || i.title.toLowerCase()))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  for (const item of rest) {
    picked.push(item);
    if (picked.length >= MAX_ITEMS) break;
  }
  return picked;
}

export async function fetchNepalNews(): Promise<NewsItem[]> {
  return cachedFetch("nepal-news", 2 * 60 * 1000, async () => {
    const batches = await Promise.allSettled(
      FEEDS.map((f) => parseFeed(f.source, f.url)),
    );
    const items = batches.flatMap((b) =>
      b.status === "fulfilled" ? b.value : [],
    );
    return diversify(items);
  }).catch(() => FALLBACK_NEWS);
}

/** Nepal keeps curated RSS; other countries use Google News search RSS. */
export async function fetchCountryNews(
  countryCode: string,
  countryName: string,
): Promise<NewsItem[]> {
  if (countryCode.toLowerCase() === "np") return fetchNepalNews();

  const q = encodeURIComponent(countryName);
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
  return cachedFetch(`news-${countryCode.toLowerCase()}`, 5 * 60 * 1000, async () => {
    const items = await parseFeed("Google News", url);
    return items.slice(0, 40);
  }).catch(() => [
    {
      id: `fallback-${countryCode}`,
      title: `Headlines for ${countryName} are temporarily unavailable`,
      link: `https://news.google.com/search?q=${q}`,
      source: "System",
      publishedAt: new Date().toISOString(),
      summary: "Live news will populate when upstream feeds respond.",
    },
  ]);
}

export function listNewsFeedSources(): string[] {
  return FEEDS.map((f) => f.source);
}

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: "fallback-1",
    title: "News feeds temporarily unavailable — retrying shortly",
    link: "https://www.onlinekhabar.com/",
    source: "System",
    publishedAt: new Date().toISOString(),
    summary:
      "Live RSS aggregation will populate this rail when upstream feeds respond.",
  },
];
