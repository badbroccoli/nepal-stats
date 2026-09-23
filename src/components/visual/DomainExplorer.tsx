"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { DomainMeta } from "@/lib/types";

const MOTIFS: Record<string, ReactNode> = {
  people: (
    <g>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.5-4 4-6 7-6s5.5 2 7 6" fill="none" strokeWidth="1.6" />
    </g>
  ),
  economy: (
    <g>
      <path d="M4 16l4-5 3 3 5-7 4 2" fill="none" strokeWidth="1.6" />
      <circle cx="16" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </g>
  ),
  government: (
    <g>
      <path d="M4 18h16M6 18V9l6-4 6 4v9M10 18v-4h4v4" fill="none" strokeWidth="1.5" />
    </g>
  ),
  health: (
    <g>
      <path d="M12 4v16M6 10h12" fill="none" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  education: (
    <g>
      <path d="M3 10l9-5 9 5-9 5-9-5z" fill="none" strokeWidth="1.5" />
      <path d="M7 12v4c2 1.5 8 1.5 10 0v-4" fill="none" strokeWidth="1.5" />
    </g>
  ),
  energy: (
    <g>
      <path d="M13 3L6 14h5l-1 7 8-12h-5l0-6z" fill="none" strokeWidth="1.5" />
    </g>
  ),
  environment: (
    <g>
      <path d="M4 17c3-8 13-10 16-2-4 1-8 3-10 6-2-2-4-3-6-4z" fill="none" strokeWidth="1.5" />
      <path d="M12 9v8" fill="none" strokeWidth="1.4" />
    </g>
  ),
  disasters: (
    <g>
      <path d="M12 3l9 16H3L12 3z" fill="none" strokeWidth="1.5" />
      <path d="M12 10v4M12 16.5v.5" fill="none" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
  tourism: (
    <g>
      <path d="M4 18l4-10 4 6 3-4 5 8" fill="none" strokeWidth="1.5" />
      <circle cx="17" cy="7" r="2" fill="none" strokeWidth="1.4" />
    </g>
  ),
  digital: (
    <g>
      <rect x="5" y="5" width="14" height="10" rx="1.5" fill="none" strokeWidth="1.5" />
      <path d="M9 19h6M12 15v4" fill="none" strokeWidth="1.5" />
    </g>
  ),
  transport: (
    <g>
      <rect x="4" y="9" width="16" height="7" rx="2" fill="none" strokeWidth="1.5" />
      <circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <path d="M7 9l2-4h6l2 4" fill="none" strokeWidth="1.4" />
    </g>
  ),
  agriculture: (
    <g>
      <path d="M12 20V9M12 9c-4 0-6 3-6 6 3 0 5-1 6-3M12 9c4 0 6 3 6 6-3 0-5-1-6-3" fill="none" strokeWidth="1.5" />
      <path d="M8 20h8" fill="none" strokeWidth="1.5" />
    </g>
  ),
  migration: (
    <g>
      <path d="M5 12h12M13 7l5 5-5 5" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  places: (
    <g>
      <path d="M12 21s-6-5.5-6-10a6 6 0 1112 0c0 4.5-6 10-6 10z" fill="none" strokeWidth="1.5" />
      <circle cx="12" cy="11" r="2" fill="none" strokeWidth="1.4" />
    </g>
  ),
  news: (
    <g>
      <rect x="4" y="5" width="16" height="14" rx="1.5" fill="none" strokeWidth="1.5" />
      <path d="M7 9h10M7 12h7M7 15h5" fill="none" strokeWidth="1.4" />
    </g>
  ),
};

export function DomainExplorer({ domains }: { domains: DomainMeta[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {domains.map((d, i) => (
        <Link
          key={d.id}
          href={d.href}
          className="domain-tile group relative overflow-hidden rounded-sm p-4 transition duration-300"
          style={{
            animationDelay: `${i * 35}ms`,
            ["--tile-accent" as string]: d.accent,
          }}
        >
          <div
            className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-30 blur-2xl transition duration-500 group-hover:opacity-55"
            style={{ background: d.accent }}
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-3">
            <svg
              viewBox="0 0 24 24"
              className="h-9 w-9 shrink-0 transition duration-300 group-hover:scale-110"
              fill="none"
              stroke={d.accent}
              aria-hidden
            >
              {MOTIFS[d.id] ?? (
                <circle cx="12" cy="12" r="6" strokeWidth="1.5" />
              )}
            </svg>
            <span
              className="mono text-[10px] tabular-nums text-[var(--muted)] opacity-0 transition group-hover:opacity-100"
              aria-hidden
            >
              →
            </span>
          </div>
          <div className="relative mt-4 display text-xl leading-tight tracking-tight group-hover:text-white">
            {d.title}
          </div>
          <div className="relative mt-1 text-xs text-[var(--muted)]">
            {d.titleNp}
          </div>
          <p className="relative mt-2 text-sm leading-snug text-[var(--muted)]">
            {d.blurb}
          </p>
          <div
            className="absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full"
            style={{ background: d.accent }}
            aria-hidden
          />
        </Link>
      ))}
    </div>
  );
}
