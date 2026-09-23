"use client";

import Link from "next/link";
import { timeAgo } from "@/lib/format";
import type { NewsItem } from "@/lib/types";

export function NewsRail({ items }: { items: NewsItem[] }) {
  const sources = [...new Set(items.map((i) => i.source))];

  return (
    <aside className="panel flex h-full min-h-0 flex-col overflow-hidden rounded-sm">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div>
          <h2 className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Live Nepali news
          </h2>
          {sources.length > 0 && (
            <div className="mt-0.5 text-[10px] text-[var(--muted)]">
              {sources.length} sources · {items.length} headlines
            </div>
          )}
        </div>
        <span className="live-dot" />
      </div>

      {items.length > 0 && (
        <div className="overflow-hidden border-b border-[var(--border)] bg-[#0a0a0a] py-2">
          <div className="news-marquee gap-8 px-4 text-xs text-[var(--muted)]">
            {[...items, ...items].map((item, idx) => (
              <a
                key={`${item.id}-${idx}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap hover:text-[var(--accent)]"
              >
                <span
                  className="h-1 w-1 rounded-full bg-[var(--accent)]"
                  aria-hidden
                />
                <span className="text-[var(--text)]">{item.title}</span>
                <span className="text-[10px] uppercase">{item.source}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <ul className="min-h-0 flex-1 space-y-0 overflow-y-auto">
        {items.map((item, i) => (
          <li
            key={item.id}
            className="animate-rise border-b border-[var(--border)] px-4 py-3 transition hover:bg-[#161616]"
            style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
          >
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                <span
                  className="rounded-sm px-1.5 py-0.5"
                  style={{
                    background: "#ffffff0c",
                    color: "var(--warn)",
                  }}
                >
                  {item.source}
                </span>
                <span>{timeAgo(item.publishedAt)}</span>
              </div>
              <div className="mt-1.5 text-sm leading-snug">{item.title}</div>
            </a>
          </li>
        ))}
      </ul>

      <div className="border-t border-[var(--border)] px-4 py-2 text-right">
        <Link
          href="/news"
          className="text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]"
        >
          All news →
        </Link>
      </div>
    </aside>
  );
}
