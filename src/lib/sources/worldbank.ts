import { fetchJson, withCache } from "../cache";
import { FALLBACK_CBR, FALLBACK_POPULATION } from "../fixtures";

type WbEntry = { date: string; value: number | null };
type WbResponse = [unknown, WbEntry[] | null];

async function latestIndicator(indicator: string): Promise<{ value: number; year: number }> {
  const url = `https://api.worldbank.org/v2/country/npl/indicator/${indicator}?format=json&per_page=5&mrnev=1`;
  const res = await fetchJson<WbResponse>(url);
  const rows = res[1] ?? [];
  const row = rows.find((r) => r.value != null);
  if (!row || row.value == null) throw new Error(`No data for ${indicator}`);
  return { value: row.value, year: Number(row.date) };
}

export async function getPopulation(): Promise<{
  value: number;
  year: number;
  stale: boolean;
}> {
  const { value, stale } = await withCache(
    "wb:pop",
    6 * 3600_000,
    () => latestIndicator("SP.POP.TOTL"),
  ).catch(() => ({ value: FALLBACK_POPULATION, stale: true }));
  return { ...value, stale };
}

export async function getCrudeBirthRate(): Promise<{
  value: number;
  year: number;
  stale: boolean;
}> {
  const { value, stale } = await withCache(
    "wb:cbr",
    6 * 3600_000,
    () => latestIndicator("SP.DYN.CBRT.IN"),
  ).catch(() => ({ value: { value: FALLBACK_CBR, year: 2022 }, stale: true }));
  return { ...value, stale };
}
