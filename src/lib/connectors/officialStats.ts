import { cachedFetch } from "./cache";
import {
  getCountrySources,
  preferredPopulationSource,
  type AgencyRef,
} from "../countrySources";

export type OfficialFigure = {
  value: number;
  asOf: string;
  source: string;
  sourceUrl?: string;
  tier: "federal" | "state" | "local" | "supranational";
  connector: string;
};

/** Eurostat population on 1 January (demo_pjan) — national totals. */
export async function fetchEurostatPopulation(
  iso2: string,
): Promise<OfficialFigure | null> {
  const geo = iso2.toUpperCase() === "GB" ? "UK" : iso2.toUpperCase();
  return cachedFetch(`eurostat-pop-${geo}`, 24 * 60 * 60 * 1000, async () => {
    const url =
      "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_pjan" +
      `?format=JSON&lang=en&geo=${geo}&sex=T&age=TOTAL&lastTimePeriod=5`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      value?: Record<string, number>;
      dimension?: {
        time?: { category?: { index?: Record<string, number> } };
      };
      source?: string;
    };
    const values = json.value ?? {};
    const timeIndex = json.dimension?.time?.category?.index ?? {};
    // Pick latest year with a value
    const years = Object.entries(timeIndex)
      .sort((a, b) => b[1] - a[1])
      .map(([y]) => y);
    for (const year of years) {
      const idx = timeIndex[year];
      const val = idx != null ? values[String(idx)] : undefined;
      if (typeof val === "number" && Number.isFinite(val)) {
        return {
          value: val,
          asOf: `${year}-01-01`,
          source: "Eurostat (national statistical institutes)",
          sourceUrl: "https://ec.europa.eu/eurostat",
          tier: "supranational" as const,
          connector: "eurostat",
        };
      }
    }
    return null;
  }).catch(() => null);
}

/** U.S. Census Bureau ACS 5-year population when CENSUS_API_KEY is set. */
export async function fetchUsCensusPopulation(): Promise<OfficialFigure | null> {
  const key = process.env.CENSUS_API_KEY;
  if (!key) return null;
  return cachedFetch("census-us-pop", 24 * 60 * 60 * 1000, async () => {
    const url =
      `https://api.census.gov/data/2023/acs/acs1?get=NAME,B01003_001E&for=us:1&key=${key}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const json = (await res.json()) as string[][];
    const row = json[1];
    if (!row) return null;
    const value = Number(row[1]);
    if (!Number.isFinite(value)) return null;
    return {
      value,
      asOf: "2023",
      source: "U.S. Census Bureau (ACS)",
      sourceUrl: "https://www.census.gov/",
      tier: "federal" as const,
      connector: "census_us",
    };
  }).catch(() => null);
}

/**
 * Resolve the best available population figure for a country.
 * Prefers national / Eurostat when configured; falls back to caller-supplied World Bank.
 */
export async function resolveOfficialPopulation(
  iso2: string,
  worldBankValue: number | null,
): Promise<OfficialFigure | null> {
  const preferred = preferredPopulationSource(iso2);
  const profile = getCountrySources(iso2);

  if (preferred === "eurostat" || hasApi(profile?.agencies, "eurostat")) {
    const eu = await fetchEurostatPopulation(iso2);
    if (eu) return eu;
  }

  if (iso2.toLowerCase() === "us") {
    const census = await fetchUsCensusPopulation();
    if (census) return census;
  }

  if (worldBankValue != null) {
    return {
      value: worldBankValue,
      asOf: new Date().toISOString().slice(0, 10),
      source: "World Bank (compiled from national statistical systems)",
      sourceUrl: `https://data.worldbank.org/country/${iso2}`,
      tier: "supranational",
      connector: "worldbank",
    };
  }

  return null;
}

function hasApi(agencies: AgencyRef[] | undefined, type: string): boolean {
  return Boolean(agencies?.some((a) => a.api?.type === type));
}

/** Lightweight HEAD/GET probe to mark which official portals respond. */
export async function probeAgency(url: string): Promise<{
  ok: boolean;
  status: number;
  ms: number;
}> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "WorldStatsDashboard/1.0 (source-probe; https://github.com/badbroccoli/nepal-stats)",
      },
    });
    clearTimeout(t);
    return { ok: res.ok || res.status < 500, status: res.status, ms: Date.now() - start };
  } catch {
    // Many gov sites block HEAD — try GET range
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "WorldStatsDashboard/1.0 (source-probe; https://github.com/badbroccoli/nepal-stats)",
          Range: "bytes=0-0",
        },
      });
      clearTimeout(t);
      return {
        ok: res.ok || res.status === 206 || res.status === 416,
        status: res.status,
        ms: Date.now() - start,
      };
    } catch {
      return { ok: false, status: 0, ms: Date.now() - start };
    }
  }
}
