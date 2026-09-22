"use client";

import { timeAgo } from "@/lib/format";
import type { NewsItem } from "@/lib/types";

export function NewsRail({
  items,
  title = "Live news",
}: {
  items: NewsItem[];
  title?: string;
}) {
  const sources = [...new Set(items.map((i) => i.source))];

  return (
    <aside className="panel flex h-full min-h-0 flex-col overflow-hidden rounded-sm">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div>
          <h2 className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            {title}
          </h2>
          {sources.length > 0 && (
            <div className="mt-0.5 text-[10px] text-[var(--muted)]">
              {sources.length} sources · {items.length} headlines
            </div>
          )}
        </div>
        <span className="live-dot" />
      </div>
      <ul className="min-h-0 flex-1 space-y-0 overflow-y-auto">
        {items.map((item) => (
          <li
            key={item.id}
            className="border-b border-[var(--border)] px-4 py-3 transition hover:bg-[#161616]"
          >
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                <span>{item.source}</span>
                <span>·</span>
                <span>{timeAgo(item.publishedAt)}</span>
              </div>
              <div className="mt-1 text-sm leading-snug">{item.title}</div>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
