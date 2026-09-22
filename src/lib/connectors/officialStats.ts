import { cachedFetch } from "./cache";
import {
  getCountrySources,
  preferredPopulationSource,
  type AgencyApiType,
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

export type PopulationAccuracy = {
  official: OfficialFigure | null;
  worldBank: number | null;
  deltaPct: number | null;
  withinTolerance: boolean | null;
  chosen: "official" | "worldbank" | "none";
  reason: string;
  candidates: OfficialFigure[];
};

/** Relative gap above which we distrust a national figure vs World Bank. */
const ACCURACY_TOLERANCE = 0.12;

/** Eurostat population on 1 January (demo_pjan) — national totals. */
export async function fetchEurostatPopulation(
  iso2: string,
): Promise<OfficialFigure | null> {
  const geo = iso2.toUpperCase() === "GB" ? "UK" : iso2.toUpperCase();
  return cachedFetch(`eurostat-pop-${geo}`, 24 * 60 * 60 * 1000, async () => {
    const url =
      "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_pjan" +
      `?format=JSON&lang=en&geo=${geo}&sex=T&age=TOTAL&lastTimePeriod=8`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      value?: Record<string, number>;
      dimension?: {
        time?: { category?: { index?: Record<string, number> } };
      };
    };
    const values = json.value ?? {};
    const timeIndex = json.dimension?.time?.category?.index ?? {};
    const years = Object.entries(timeIndex)
      .sort((a, b) => b[1] - a[1])
      .map(([y]) => y);
    for (const year of years) {
      const idx = timeIndex[year];
      const val = idx != null ? values[String(idx)] : undefined;
      if (typeof val === "number" && Number.isFinite(val) && val > 0) {
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

/** U.S. Census Bureau ACS population when CENSUS_API_KEY is set. */
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
    if (!Number.isFinite(value) || value <= 0) return null;
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

/** Statistics Canada quarterly population estimates (table 17-10-0009, Canada). */
export async function fetchStatCanPopulation(): Promise<OfficialFigure | null> {
  return cachedFetch("statcan-pop", 12 * 60 * 60 * 1000, async () => {
    const res = await fetch(
      "https://www150.statcan.gc.ca/t1/wds/rest/getDataFromVectorsAndLatestNPeriods",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ vectorId: 1, latestN: 1 }]),
        next: { revalidate: 43200 },
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{
      status?: string;
      object?: {
        vectorDataPoint?: Array<{ value?: number; refPer?: string }>;
      };
    }>;
    const point = json[0]?.object?.vectorDataPoint?.[0];
    const value = Number(point?.value);
    if (!Number.isFinite(value) || value <= 0) return null;
    return {
      value,
      asOf: point?.refPer ?? new Date().toISOString().slice(0, 10),
      source: "Statistics Canada (table 17-10-0009)",
      sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1710000901",
      tier: "federal" as const,
      connector: "statcan",
    };
  }).catch(() => null);
}

/** Australian Bureau of Statistics estimated resident population (ERP_Q). */
export async function fetchAbsPopulation(): Promise<OfficialFigure | null> {
  return cachedFetch("abs-pop", 12 * 60 * 60 * 1000, async () => {
    const url =
      "https://data.api.abs.gov.au/rest/data/ABS,ERP_Q/1.3.TOT.AUS.Q" +
      "?startPeriod=2020&detail=dataonly&format=jsondata";
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 43200 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: {
        dataSets?: Array<{
          series?: Record<string, { observations?: Record<string, number[]> }>;
        }>;
        structures?: Array<{
          dimensions?: {
            observation?: Array<{
              values?: Array<{ id?: string }>;
            }>;
          };
        }>;
      };
    };
    const series = json.data?.dataSets?.[0]?.series;
    const times =
      json.data?.structures?.[0]?.dimensions?.observation?.[0]?.values ?? [];
    if (!series) return null;
    let best: { asOf: string; value: number } | null = null;
    for (const s of Object.values(series)) {
      for (const [idx, arr] of Object.entries(s.observations ?? {})) {
        const value = Number(arr?.[0]);
        const asOf = times[Number(idx)]?.id;
        if (!asOf || !Number.isFinite(value) || value <= 0) continue;
        if (!best || comparePeriod(asOf, best.asOf) > 0) {
          best = { asOf, value };
        }
      }
    }
    if (!best) return null;
    return {
      value: best.value,
      asOf: best.asOf,
      source: "Australian Bureau of Statistics (ERP)",
      sourceUrl: "https://www.abs.gov.au/",
      tier: "federal" as const,
      connector: "abs",
    };
  }).catch(() => null);
}

/** IBGE Brazil resident population estimates (agregado 6579). */
export async function fetchIbgePopulation(): Promise<OfficialFigure | null> {
  return cachedFetch("ibge-pop", 12 * 60 * 60 * 1000, async () => {
    const url =
      "https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/-8/variaveis/9324?localidades=N1";
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 43200 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{
      resultados?: Array<{
        series?: Array<{ serie?: Record<string, string> }>;
      }>;
    }>;
    const serie = json[0]?.resultados?.[0]?.series?.[0]?.serie ?? {};
    const years = Object.keys(serie)
      .map(Number)
      .filter((y) => Number.isFinite(y))
      .sort((a, b) => b - a);
    for (const year of years) {
      const value = Number(serie[String(year)]);
      if (Number.isFinite(value) && value > 0) {
        return {
          value,
          asOf: `${year}-01-01`,
          source: "IBGE (estimativas de população)",
          sourceUrl: "https://www.ibge.gov.br/",
          tier: "federal" as const,
          connector: "ibge",
        };
      }
    }
    return null;
  }).catch(() => null);
}

function comparePeriod(a: string, b: string): number {
  // Handles YYYY, YYYY-MM-DD, YYYY-Qn
  const norm = (s: string) => {
    const q = s.match(/^(\d{4})-Q(\d)$/i);
    if (q) return Number(q[1]) * 10 + Number(q[2]);
    const d = Date.parse(s);
    if (Number.isFinite(d)) return d;
    const y = Number(s.slice(0, 4));
    return Number.isFinite(y) ? y * 10 : 0;
  };
  return norm(a) - norm(b);
}

async function fetchByConnector(
  type: string,
  iso2: string,
): Promise<OfficialFigure | null> {
  switch (type) {
    case "eurostat":
      return fetchEurostatPopulation(iso2);
    case "census_us":
      return fetchUsCensusPopulation();
    case "statcan":
      return fetchStatCanPopulation();
    case "abs":
      return fetchAbsPopulation();
    case "ibge":
      return fetchIbgePopulation();
    default:
      return null;
  }
}

/**
 * Probe every wired national/supranational population connector for a country,
 * cross-check against World Bank, and pick the best figure.
 */
export async function probePopulationAccuracy(
  iso2: string,
  worldBankValue: number | null,
): Promise<PopulationAccuracy> {
  const code = iso2.toLowerCase();
  const profile = getCountrySources(code);
  const preferred = preferredPopulationSource(code);

  const types = new Set<string>();
  if (preferred && preferred !== "worldbank") types.add(preferred);
  for (const a of profile?.agencies ?? []) {
    if (a.api?.type && a.api.type !== "worldbank" && isPopulationApi(a.api.type)) {
      types.add(a.api.type);
    }
  }
  // Always try Eurostat for EU geos even if preferred slipped
  if (hasApi(profile?.agencies, "eurostat")) types.add("eurostat");

  const candidates: OfficialFigure[] = [];
  await Promise.all(
    [...types].map(async (t) => {
      const fig = await fetchByConnector(t, code);
      if (fig) candidates.push(fig);
    }),
  );

  // Prefer federal, then preferred connector, then newest asOf
  candidates.sort((a, b) => {
    const tierScore = (t: OfficialFigure["tier"]) =>
      t === "federal" ? 3 : t === "supranational" ? 2 : 1;
    const td = tierScore(b.tier) - tierScore(a.tier);
    if (td !== 0) return td;
    if (a.connector === preferred && b.connector !== preferred) return -1;
    if (b.connector === preferred && a.connector !== preferred) return 1;
    return comparePeriod(b.asOf, a.asOf);
  });

  const official = candidates[0] ?? null;
  if (!official && worldBankValue == null) {
    return {
      official: null,
      worldBank: worldBankValue,
      deltaPct: null,
      withinTolerance: null,
      chosen: "none",
      reason: "No population figure available",
      candidates,
    };
  }
  if (!official) {
    return {
      official: null,
      worldBank: worldBankValue,
      deltaPct: null,
      withinTolerance: null,
      chosen: "worldbank",
      reason: "No national API response; using World Bank compiled series",
      candidates,
    };
  }
  if (worldBankValue == null || worldBankValue <= 0) {
    return {
      official,
      worldBank: worldBankValue,
      deltaPct: null,
      withinTolerance: null,
      chosen: "official",
      reason: `Using ${official.source} (no World Bank baseline to cross-check)`,
      candidates,
    };
  }

  const deltaPct =
    Math.abs(official.value - worldBankValue) / worldBankValue;
  const withinTolerance = deltaPct <= ACCURACY_TOLERANCE;

  if (withinTolerance) {
    return {
      official,
      worldBank: worldBankValue,
      deltaPct,
      withinTolerance,
      chosen: "official",
      reason: `${official.source} within ${(ACCURACY_TOLERANCE * 100).toFixed(0)}% of World Bank (Δ ${(deltaPct * 100).toFixed(2)}%)`,
      candidates,
    };
  }

  // Out of tolerance — keep World Bank but surface the conflict
  return {
    official,
    worldBank: worldBankValue,
    deltaPct,
    withinTolerance,
    chosen: "worldbank",
    reason: `${official.source} diverges ${(deltaPct * 100).toFixed(1)}% from World Bank; keeping World Bank until reconciled`,
    candidates,
  };
}

/**
 * Resolve the best available population figure for a country.
 * Prefers national / Eurostat when wired and accuracy-checked vs World Bank.
 */
export async function resolveOfficialPopulation(
  iso2: string,
  worldBankValue: number | null,
): Promise<OfficialFigure | null> {
  const probe = await probePopulationAccuracy(iso2, worldBankValue);
  if (probe.chosen === "official" && probe.official) {
    return probe.official;
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
  return probe.official;
}

function isPopulationApi(type: AgencyApiType | string): boolean {
  return [
    "eurostat",
    "census_us",
    "statcan",
    "abs",
    "ibge",
    "ons",
    "estat_jp",
  ].includes(type);
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
