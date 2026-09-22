import Parser from "rss-parser";
import { withCache } from "../cache";
import { FALLBACK_NEWS } from "../fixtures";
import type { NewsItem } from "../types";

const FEEDS: { source: string; url: string }[] = [
  { source: "OnlineKhabar", url: "https://www.onlinekhabar.com/feed" },
  { source: "OnlineKhabar EN", url: "https://english.onlinekhabar.com/feed" },
  { source: "Ratopati", url: "https://ratopati.com/feed" },
];

const parser = new Parser({ timeout: 8000 });

function hash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\u0900-\u097f]+/g, "").slice(0, 60);
}

async function loadFeeds(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return (parsed.items ?? []).slice(0, 12).map<NewsItem>((item) => ({
        id: hash(item.link ?? item.guid ?? item.title ?? Math.random().toString()),
        title: (item.title ?? "Untitled").trim(),
        link: item.link ?? "#",
        source: feed.source,
        publishedAt: item.isoDate ?? (item.pubDate ? new Date(item.pubDate).toISOString() : null),
        summary: item.contentSnippet?.slice(0, 180),
      }));
    }),
  );

  const items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (items.length === 0) throw new Error("All RSS feeds failed");

  const seenUrl = new Set<string>();
  const seenTitle = new Set<string>();
  const deduped: NewsItem[] = [];
  for (const item of items) {
    const titleKey = normalizeTitle(item.title);
    if (seenUrl.has(item.link) || seenTitle.has(titleKey)) continue;
    seenUrl.add(item.link);
    seenTitle.add(titleKey);
    deduped.push(item);
  }

  deduped.sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });

  return deduped.slice(0, 24);
}

export async function getNews(): Promise<{ items: NewsItem[]; stale: boolean }> {
  const { value, stale } = await withCache("news", 3 * 60_000, loadFeeds).catch(() => ({
    value: FALLBACK_NEWS,
    stale: true,
  }));
  return { items: value, stale };
}
