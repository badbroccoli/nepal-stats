import { cachedFetch } from "./cache";

export type WbSeriesPoint = { year: string; value: number };

async function wbFetch(
  iso3: string,
  indicator: string,
  params: string,
): Promise<Array<{ value: number | null; date: string }>> {
  const code = iso3.toLowerCase();
  const url = `https://api.worldbank.org/v2/country/${code}/indicator/${indicator}?format=json&${params}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const json = (await res.json()) as [
    unknown,
    Array<{ value: number | null; date: string }> | undefined,
  ];
  return json[1] ?? [];
}

export async function fetchWorldBankPopulation(
  iso3: string,
): Promise<number | null> {
  const code = iso3.toLowerCase();
  return cachedFetch(`wb-pop-${code}`, 24 * 60 * 60 * 1000, async () => {
    const rows = await wbFetch(iso3, "SP.POP.TOTL", "per_page=5&mrnev=1");
    return rows.find((r) => r.value != null)?.value ?? null;
  }).catch(() => null);
}

export async function fetchWorldBankIndicator(
  iso3: string,
  indicator: string,
  cacheKey: string,
): Promise<number | null> {
  const code = iso3.toLowerCase();
  return cachedFetch(`wb-${cacheKey}-${code}`, 24 * 60 * 60 * 1000, async () => {
    const rows = await wbFetch(iso3, indicator, "per_page=5&mrnev=1");
    return rows.find((r) => r.value != null)?.value ?? null;
  }).catch(() => null);
}

/** Annual series for charts (oldest → newest). */
export async function fetchWorldBankSeries(
  iso3: string,
  indicator: string,
  years = 20,
): Promise<WbSeriesPoint[]> {
  const code = iso3.toLowerCase();
  const end = new Date().getFullYear();
  const start = end - years;
  return cachedFetch(
    `wb-series-${indicator}-${code}-${start}-${end}`,
    24 * 60 * 60 * 1000,
    async () => {
      const rows = await wbFetch(
        iso3,
        indicator,
        `date=${start}:${end}&per_page=100`,
      );
      return rows
        .filter((r): r is { value: number; date: string } => r.value != null)
        .map((r) => ({
          year: r.date,
          value: Math.round(r.value * 1000) / 1000,
        }))
        .sort((a, b) => a.year.localeCompare(b.year));
    },
  ).catch(() => []);
}
