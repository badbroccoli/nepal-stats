import { XMLParser } from "fast-xml-parser";
import type { NewsItem } from "../types";
import { cachedFetch } from "./cache";

const FEEDS: { source: string; url: string }[] = [
  { source: "OnlineKhabar", url: "https://www.onlinekhabar.com/feed" },
  {
    source: "Nagarik",
    url: "https://nagariknews.nagariknetwork.com/feed",
  },
  {
    source: "Republica",
    url: "https://myrepublica.nagariknetwork.com/feed",
  },
  { source: "Setopati", url: "https://www.setopati.com/feed" },
  { source: "Ratopati", url: "https://www.ratopati.com/feed" },
];

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
      "User-Agent": "NepalStatsDashboard/1.0 (+https://github.com/badbroccoli/nepal-stats)",
      Accept: "application/rss+xml, application/xml, text/xml",
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
    return {
      id: `${source}-${idx}-${link}`.slice(0, 180),
      title: title.trim(),
      link: String(link),
      source,
      publishedAt: new Date(published).toISOString(),
      summary,
    } satisfies NewsItem;
  });
}

export async function fetchNepalNews(): Promise<NewsItem[]> {
  return cachedFetch("nepal-news", 2 * 60 * 1000, async () => {
    const batches = await Promise.allSettled(
      FEEDS.map((f) => parseFeed(f.source, f.url)),
    );
    const items = batches.flatMap((b) =>
      b.status === "fulfilled" ? b.value : [],
    );
    const seen = new Set<string>();
    const deduped: NewsItem[] = [];
    for (const item of items) {
      const key = item.link || item.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }
    deduped.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    return deduped.slice(0, 40);
  }).catch(() => FALLBACK_NEWS);
}

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: "fallback-1",
    title: "News feeds temporarily unavailable — retrying shortly",
    link: "https://www.onlinekhabar.com/",
    source: "System",
    publishedAt: new Date().toISOString(),
    summary: "Live RSS aggregation will populate this rail when upstream feeds respond.",
  },
];
