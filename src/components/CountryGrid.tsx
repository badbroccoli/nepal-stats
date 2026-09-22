"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { COUNTRIES, type Country } from "@/lib/countries";

const REGIONS = [
  "All",
  "Africa",
  "Americas",
  "Asia",
  "Europe",
  "Oceania",
] as const;

function Flag({ country }: { country: Country }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={country.flag}
      alt=""
      width={40}
      height={30}
      loading="lazy"
      className="h-7 w-10 rounded-[2px] object-cover ring-1 ring-[#2a2a2a]"
    />
  );
}

export function CountryGrid() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("All");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return COUNTRIES.filter((c) => {
      if (region !== "All" && c.region !== region) return false;
      if (!query) return true;
      return (
        c.name.toLowerCase().includes(query) ||
        c.code.includes(query) ||
        (c.capital ?? "").toLowerCase().includes(query)
      );
    });
  }, [q, region]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-sm border border-[var(--border)] bg-[radial-gradient(ellipse_at_top,_#1a2418_0%,_#070807_55%)] px-5 py-10 md:px-10 md:py-14">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            World national pulse
          </div>
          <h1 className="display mt-3 text-4xl md:text-5xl">
            Every country.{" "}
            <span className="text-[var(--accent)]">One model.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
            Pick a nation to open a live dashboard — map, headlines, markets,
            hazards, and domain stats — generated dynamically for every country.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search country, capital, or code…"
            className="w-full max-w-md rounded-sm border border-[var(--border)] bg-[#0c0c0c] px-3 py-2.5 text-sm outline-none ring-[var(--accent)] placeholder:text-[var(--muted)] focus:ring-1"
            aria-label="Search countries"
          />
          <div className="flex flex-wrap gap-1.5">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                className={`rounded-sm px-2.5 py-1.5 text-[11px] uppercase tracking-wider ${
                  region === r
                    ? "bg-[var(--accent)] text-black"
                    : "border border-[var(--border)] text-[var(--muted)] hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 text-[11px] text-[var(--muted)]">
          {filtered.length} of {COUNTRIES.length} countries
        </div>
      </section>

      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((c) => (
          <Link
            key={c.code}
            href={`/${c.code}`}
            className="panel group flex items-center gap-3 rounded-sm p-3 transition hover:border-[#3a3a3a] hover:bg-[#141414]"
          >
            <Flag country={c} />
            <div className="min-w-0">
              <div className="truncate text-sm group-hover:text-white">
                {c.name}
              </div>
              <div className="truncate text-[10px] uppercase tracking-wider text-[var(--muted)]">
                {c.code} · {c.capital || c.region}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-[var(--muted)]">
          No countries match that search.
        </p>
      )}
    </div>
  );
}
