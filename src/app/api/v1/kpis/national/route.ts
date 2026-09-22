import { NextResponse } from "next/server";
import { getEarthquakes } from "@/lib/sources/usgs";
import { getUsdRate } from "@/lib/sources/nrb";
import { getCrudeBirthRate, getPopulation } from "@/lib/sources/worldbank";
import type { NationalKpis } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date().toISOString();
  const [pop, cbr, usd, quakes] = await Promise.all([
    getPopulation(),
    getCrudeBirthRate(),
    getUsdRate(),
    getEarthquakes(24),
  ]);

  const payload: NationalKpis = {
    generatedAt: now,
    population: {
      key: "population.total",
      label: "Population (est.)",
      value: pop.value,
      unit: "people",
      source: "World Bank (SP.POP.TOTL)",
      sourceUrl: "https://data.worldbank.org/indicator/SP.POP.TOTL?locations=NP",
      observedAt: `${pop.year}-01-01T00:00:00Z`,
      ingestedAt: now,
      freshness: "estimated",
      stale: pop.stale,
      note: `Annual national figure for ${pop.year}. Not a live counter.`,
    },
    crudeBirthRate: {
      key: "population.cbr",
      label: "Crude birth rate",
      value: cbr.value,
      unit: "per 1,000",
      source: "World Bank (SP.DYN.CBRT.IN)",
      sourceUrl: "https://data.worldbank.org/indicator/SP.DYN.CBRT.IN?locations=NP",
      observedAt: `${cbr.year}-01-01T00:00:00Z`,
      ingestedAt: now,
      freshness: "estimated",
      stale: cbr.stale,
    },
    forexUsd: {
      key: "forex.usd",
      label: "USD → NPR (sell)",
      value: usd.value,
      unit: "NPR",
      source: "Nepal Rastra Bank",
      sourceUrl: "https://www.nrb.org.np/forex/",
      observedAt: usd.date === "cached" ? null : `${usd.date}T00:00:00Z`,
      ingestedAt: now,
      freshness: "daily",
      stale: usd.stale,
    },
    earthquakes24h: {
      key: "disaster.eq24h",
      label: "Earthquakes (24h)",
      value: quakes.events.length,
      unit: "events",
      source: "USGS FDSN",
      sourceUrl: "https://earthquake.usgs.gov/",
      observedAt: now,
      ingestedAt: now,
      freshness: "near-real-time",
      stale: quakes.stale,
      note: "Nepal bounding box (26–31°N, 80–89°E).",
    },
  };

  return NextResponse.json(payload, {
    headers: { "cache-control": "public, max-age=30, stale-while-revalidate=120" },
  });
}
