"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TalkTerm, TalkingNow } from "@/lib/talking";
import { timeAgo } from "@/lib/format";
import Link from "next/link";

type Placed = TalkTerm & {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  w: number;
  h: number;
};

const KIND_COLOR: Record<TalkTerm["kind"], string> = {
  trend: "#f4d35e",
  news: "#3ddc97",
  both: "#7BDFF2",
};

function measure(text: string, fontSize: number): { w: number; h: number } {
  // Approximate glyph box — good enough for packing without canvas measure on SSR
  const nepali = /[\u0900-\u097F]/.test(text);
  const factor = nepali ? 0.92 : 0.58;
  return { w: text.length * fontSize * factor + 8, h: fontSize * 1.25 };
}

function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  pad = 4,
) {
  return !(
    a.x + a.w / 2 + pad < b.x - b.w / 2 ||
    a.x - a.w / 2 - pad > b.x + b.w / 2 ||
    a.y + a.h / 2 + pad < b.y - b.h / 2 ||
    a.y - a.h / 2 - pad > b.y + b.h / 2
  );
}

function layoutTerms(
  terms: TalkTerm[],
  width: number,
  height: number,
): Placed[] {
  const cx = width / 2;
  const cy = height / 2;
  const placed: Placed[] = [];
  const max = Math.min(terms.length, 36);

  for (let i = 0; i < max; i++) {
    const t = terms[i];
    const fontSize = Math.round(12 + t.score * (i === 0 ? 34 : 28));
    const { w, h } = measure(t.text, fontSize);
    let x = cx;
    let y = cy;
    let found = i === 0;

    if (i > 0) {
      const spiral = 0.55 + (i % 5) * 0.08;
      for (let step = 0; step < 900; step++) {
        const angle = step * spiral;
        const r = 6 + step * 0.9;
        x = cx + Math.cos(angle) * r * 1.15;
        y = cy + Math.sin(angle) * r * 0.72;
        const box = { x, y, w, h };
        if (
          x - w / 2 < 8 ||
          x + w / 2 > width - 8 ||
          y - h / 2 < 10 ||
          y + h / 2 > height - 10
        ) {
          continue;
        }
        if (!placed.some((p) => overlaps(box, p))) {
          found = true;
          break;
        }
      }
    }

    if (!found) continue;
    placed.push({
      ...t,
      x,
      y,
      fontSize,
      color: KIND_COLOR[t.kind],
      w,
      h,
    });
  }
  return placed;
}

export function TalkingCloud({ data }: { data: TalkingNow }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 520, h: 340 });
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setSize({
        w: Math.max(280, Math.floor(cr.width)),
        h: Math.max(260, Math.floor(cr.height)),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const placed = useMemo(
    () => layoutTerms(data.terms, size.w, size.h),
    [data.terms, size.w, size.h],
  );

  const active = placed.find((p) => p.text === hover) ?? null;

  return (
    <div className="hero-panel flex h-full min-h-[340px] flex-col rounded-sm p-4 md:p-5">
      <div className="relative z-[1] flex items-start justify-between gap-3">
        <div>
          <div className="section-kicker">Talking now</div>
          <h1 className="display mt-1 text-2xl md:text-3xl">
            What’s hot in Nepal
          </h1>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {data.trendCount} Google Trends · {data.headlineCount} headlines ·{" "}
            {data.sourceCount} sources · {timeAgo(data.generatedAt)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#3ddc9740] bg-[#3ddc9714] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
          <span className="live-dot" />
          Live
        </span>
      </div>

      <div
        ref={wrapRef}
        className="relative z-[1] mt-3 min-h-0 flex-1 overflow-hidden rounded-sm border border-[var(--border)] bg-[#05050566]"
      >
        {placed.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-sm text-[var(--muted)]">
            Gathering conversation signals…
          </div>
        ) : (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${size.w} ${size.h}`}
            className="block h-full w-full"
            role="img"
            aria-label="Word cloud of topics being discussed in Nepal"
          >
            {placed.map((p) => (
              <text
                key={p.text}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={p.color}
                fontSize={p.fontSize}
                className="cursor-default transition-opacity"
                style={{
                  fontFamily: "var(--font-display), Georgia, serif",
                  opacity: hover && hover !== p.text ? 0.35 : 0.92,
                }}
                onMouseEnter={() => setHover(p.text)}
                onMouseLeave={() => setHover(null)}
              >
                {p.text}
              </text>
            ))}
          </svg>
        )}
      </div>

      <div className="relative z-[1] mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--muted)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f4d35e]" /> Trends
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3ddc97]" /> Newsrooms
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7BDFF2]" /> Both
          </span>
        </div>
        <Link href="/news" className="text-[var(--accent)]">
          Full news →
        </Link>
      </div>

      {active && (
        <div className="relative z-[1] mt-2 rounded-sm border border-[var(--border)] bg-[#00000055] px-3 py-2 text-xs">
          <span className="display text-sm" style={{ color: active.color }}>
            {active.text}
          </span>
          <span className="ml-2 text-[var(--muted)]">
            {active.kind === "both"
              ? "Trending searches + newsrooms"
              : active.kind === "trend"
                ? "Rising in Google Trends (Nepal)"
                : "Recurring across Nepali headlines"}
            {active.sources.length > 0 &&
              ` · ${active.sources.slice(0, 3).join(", ")}`}
          </span>
        </div>
      )}

      <p className="relative z-[1] mt-2 text-[10px] leading-relaxed text-[var(--muted)]">
        {data.method}
      </p>
    </div>
  );
}
