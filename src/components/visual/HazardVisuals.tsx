"use client";

import { timeAgo } from "@/lib/format";
import type { DisasterIncident } from "@/lib/types";

export function HazardMixBars({
  items,
}: {
  items: { hazard: string; count: number; color: string }[];
}) {
  const total = items.reduce((s, i) => s + i.count, 0) || 1;

  return (
    <div>
      <div
        className="flex h-3 overflow-hidden rounded-sm"
        role="img"
        aria-label="Hazard mix"
      >
        {items.map((h) => (
          <div
            key={h.hazard}
            className="hazard-seg h-full transition-[flex-grow] duration-700"
            style={{
              flexGrow: h.count,
              background: h.color,
              minWidth: h.count > 0 ? 4 : 0,
            }}
            title={`${h.hazard}: ${h.count}`}
          />
        ))}
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((h, i) => {
          const pct = (h.count / total) * 100;
          return (
            <li
              key={h.hazard}
              className="animate-rise flex items-center gap-3"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span
                className="h-8 w-1.5 shrink-0 rounded-full"
                style={{ background: h.color }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm">{h.hazard}</span>
                  <span className="mono shrink-0 text-sm tabular-nums">
                    {h.count}
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-sm bg-[#ffffff0a]">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${pct}%`,
                      background: h.color,
                      transition: "width 0.8s cubic-bezier(.22,1,.36,1)",
                    }}
                  />
                </div>
              </div>
              <span className="mono w-10 shrink-0 text-right text-[10px] text-[var(--muted)]">
                {pct.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DisasterFeed({
  disasters,
}: {
  disasters: DisasterIncident[];
}) {
  if (!disasters.length) {
    return (
      <p className="text-sm text-[var(--muted)]">
        No recent BIPAD / USGS hazard events right now.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {disasters.map((d, i) => (
        <li
          key={d.id}
          className="animate-rise group relative flex gap-3 rounded-sm py-2.5 pl-1 pr-1 transition hover:bg-[#ffffff06]"
          style={{ animationDelay: `${i * 35}ms` }}
        >
          <div className="relative mt-0.5 flex w-10 shrink-0 flex-col items-center">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-medium"
              style={{
                background: `${d.hazardColor}22`,
                color: d.hazardColor,
                boxShadow: `0 0 0 1px ${d.hazardColor}44`,
              }}
            >
              {d.mag != null ? `M${d.mag}` : d.hazard.slice(0, 2).toUpperCase()}
            </span>
            {i < disasters.length - 1 && (
              <span
                className="mt-1 w-px flex-1 bg-[var(--border)]"
                aria-hidden
              />
            )}
          </div>
          <div className="min-w-0 flex-1 border-b border-[var(--border)] pb-2.5 group-last:border-0">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                {d.hazard}
              </span>
              <span className="shrink-0 text-[10px] text-[var(--muted)]">
                {timeAgo(d.time)}
              </span>
            </div>
            <div className="mt-0.5 text-sm leading-snug">
              {d.url ? (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--accent)]"
                >
                  {d.title}
                </a>
              ) : (
                d.title
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
