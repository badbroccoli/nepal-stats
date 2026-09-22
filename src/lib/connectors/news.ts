import { XMLParser } from "fast-xml-parser";
import type { NewsItem } from "../types";
import { cachedFetch } from "./cache";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

function asArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

async function parseFeed(source: string, url: string): Promise<NewsItem[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "WorldStatsDashboard/1.0 (https://github.com/badbroccoli/nepal-stats)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
  const xml = await res.text();
  const parsed = parser.parse(xml) as {
    rss?: { channel?: { item?: unknown } };
    feed?: { entry?: unknown };
  };

  const rssItems = asArray(
    parsed.rss?.channel?.item as
      | Array<{
          title?: string;
          link?: string | { href?: string };
          pubDate?: string;
          description?: string;
          source?: string | { "#text"?: string };
        }>
      | undefined,
  );

  const out: NewsItem[] = [];
  rssItems.forEach((item, i) => {
    const link =
      typeof item.link === "string"
        ? item.link
        : (item.link as { href?: string } | undefined)?.href ?? "";
    const title = item.title ?? "";
    if (!title || !link) return;
    out.push({
      id: `${source}-${i}-${link.slice(0, 48)}`,
      title,
      link,
      source:
        typeof item.source === "string"
          ? item.source
          : item.source?.["#text"] || source,
      publishedAt: item.pubDate
        ? new Date(item.pubDate).toISOString()
        : new Date().toISOString(),
      summary: item.description,
    });
  });
  return out;
}

/** Google News RSS search for any country name. */
export async function fetchCountryNews(
  countryCode: string,
  countryName: string,
): Promise<NewsItem[]> {
  const q = encodeURIComponent(countryName);
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
  return cachedFetch(
    `news-v2-${countryCode.toLowerCase()}`,
    5 * 60 * 1000,
    async () => {
      const items = await parseFeed("Google News", url);
      return items.slice(0, 40);
    },
  ).catch(() => [
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
