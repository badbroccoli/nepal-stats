import { XMLParser } from "fast-xml-parser";
import { cachedFetch } from "./cache";

export interface TrendItem {
  title: string;
  traffic: number;
  related: string[];
}

const TRENDS_URL =
  "https://trends.google.com/trending/rss?geo=NP&hours=48";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
});

function asArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function parseTraffic(raw: unknown): number {
  if (raw == null) return 200;
  const s = String(raw).replace(/,/g, "").replace(/\+/g, "");
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : 200;
}

async function loadTrends(): Promise<TrendItem[]> {
  const res = await fetch(TRENDS_URL, {
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
  const items = asArray(doc?.rss?.channel?.item);

  return items
    .map((item) => {
      const title = String(item.title ?? "").trim();
      if (!title) return null;
      const news = asArray(item.news_item);
      const related = news
        .map((n) => String(n?.news_item_title ?? "").trim())
        .filter(Boolean)
        .slice(0, 4);
      return {
        title,
        traffic: parseTraffic(item.approx_traffic),
        related,
      } satisfies TrendItem;
    })
    .filter((t): t is TrendItem => Boolean(t));
}

export async function fetchNepalTrends(): Promise<TrendItem[]> {
  return cachedFetch("nepal-trends", 15 * 60 * 1000, loadTrends).catch(
    () => [],
  );
}
