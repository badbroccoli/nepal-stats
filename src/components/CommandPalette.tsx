"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DOMAINS } from "@/lib/domains";
import { DOMAIN_CLUSTERS, domainsInCluster } from "@/lib/nav";

type Hit = {
  href: string;
  title: string;
  titleNp: string;
  blurb: string;
  accent: string;
  group: string;
  keywords: string;
};

function buildHits(): Hit[] {
  const hits: Hit[] = [
    {
      href: "/",
      title: "National pulse",
      titleNp: "राष्ट्रिय पल्स",
      blurb: "Live snapshot of Nepal",
      accent: "#3ddc97",
      group: "Home",
      keywords: "home pulse overview dashboard",
    },
  ];

  for (const cluster of DOMAIN_CLUSTERS) {
    for (const d of domainsInCluster(cluster)) {
      hits.push({
        href: d.href,
        title: d.title,
        titleNp: d.titleNp,
        blurb: d.blurb,
        accent: d.accent,
        group: cluster.label,
        keywords: `${d.id} ${d.title} ${d.titleNp} ${d.blurb} ${cluster.label}`,
      });
    }
  }

  for (const id of ["places", "news"] as const) {
    const d = DOMAINS.find((x) => x.id === id)!;
    hits.push({
      href: d.href,
      title: d.title,
      titleNp: d.titleNp,
      blurb: d.blurb,
      accent: d.accent,
      group: "Explore",
      keywords: `${d.id} ${d.title} ${d.titleNp} ${d.blurb}`,
    });
  }

  return hits;
}

const ALL = buildHits();

function fuzzy(q: string, hit: Hit): number {
  const needle = q.trim().toLowerCase();
  if (!needle) return 1;
  const hay = `${hit.title} ${hit.titleNp} ${hit.blurb} ${hit.keywords}`.toLowerCase();
  if (hay.includes(needle)) return 3;
  const parts = needle.split(/\s+/);
  if (parts.every((p) => hay.includes(p))) return 2;
  let i = 0;
  for (const ch of hay) {
    if (ch === needle[i]) i++;
    if (i >= needle.length) return 1;
  }
  return 0;
}

/** Mount only while open — fresh state, no reset-in-effect. */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const scored = ALL.map((h) => ({ h, s: fuzzy(query, h) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.h.title.localeCompare(b.h.title));
    return scored.map((x) => x.h);
  }, [query]);

  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const groups = results.reduce<Record<string, Hit[]>>((acc, h) => {
    (acc[h.group] ??= []).push(h);
    return acc;
  }, {});

  let flatIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-[#000000b8] px-4 pt-[12vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Jump to topic"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cmdk-panel w-full max-w-xl overflow-hidden rounded-sm border border-[var(--border)] bg-[#0e0e0e] shadow-[0_24px_80px_#000a]">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-[var(--muted)]"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && results[active]) {
                e.preventDefault();
                go(results[active].href);
              }
            }}
            placeholder="Jump to a topic… literacy, AQI, remittance"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
            aria-autocomplete="list"
            aria-controls="cmdk-list"
          />
          <kbd className="hidden rounded-sm border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)] sm:inline">
            esc
          </kbd>
        </div>

        <div
          id="cmdk-list"
          className="max-h-[50vh] overflow-y-auto p-2"
          role="listbox"
        >
          {results.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-[var(--muted)]">
              No topics match “{query}”
            </div>
          )}
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mb-2">
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                {group}
              </div>
              {items.map((hit) => {
                flatIndex += 1;
                const idx = flatIndex;
                const selected = idx === active;
                return (
                  <button
                    key={hit.href}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`flex w-full items-start gap-3 rounded-sm px-3 py-2.5 text-left transition ${
                      selected ? "bg-[#ffffff10]" : "hover:bg-[#ffffff08]"
                    }`}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(hit.href)}
                  >
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: hit.accent }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-[var(--text)]">
                        {hit.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--muted)]">
                        {hit.titleNp} · {hit.blurb}
                      </span>
                    </span>
                    {selected && (
                      <span className="mono mt-0.5 text-[10px] text-[var(--muted)]">
                        ↵
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--muted)]">
          <span>↑↓ navigate · ↵ open</span>
          <span>{results.length} topics</span>
        </div>
      </div>
    </div>
  );
}
