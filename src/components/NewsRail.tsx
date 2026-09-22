"use client";

import { formatRelative } from "@/lib/format";
import { usePolling } from "@/lib/usePolling";
import type { NewsItem } from "@/lib/types";

interface NewsResponse {
  count: number;
  stale: boolean;
  items: NewsItem[];
}

export function NewsRail() {
  const { data, error, loading } = usePolling<NewsResponse>("/api/v1/news", 120_000);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Nepali News
        </h2>
        {data?.stale && (
          <span className="rounded border border-danger/40 bg-danger/10 px-1.5 py-0.5 text-[10px] uppercase text-danger">
            Cached
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loading && !data && <p className="text-xs text-neutral-500">Loading headlines…</p>}
        {error && !data && <p className="text-xs text-danger">Failed to load news: {error}</p>}
        <ul className="flex flex-col gap-2">
          {data?.items.map((item) => (
            <li key={item.id}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md border border-line bg-base-850 p-2.5 transition-colors hover:border-accent/40 hover:bg-base-800"
              >
                <p className="line-clamp-3 text-[13px] leading-snug text-neutral-200">
                  {item.title}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-neutral-500">
                  <span className="text-accent/80">{item.source}</span>
                  <span>{formatRelative(item.publishedAt)}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
