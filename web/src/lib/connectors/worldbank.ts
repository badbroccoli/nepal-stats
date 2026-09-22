import { cachedFetch } from "./cache";

export async function fetchWorldBankPopulation(): Promise<number | null> {
  return cachedFetch("wb-pop", 24 * 60 * 60 * 1000, async () => {
    const url =
      "https://api.worldbank.org/v2/country/npl/indicator/SP.POP.TOTL?format=json&per_page=5&mrnev=1";
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const json = (await res.json()) as [
      unknown,
      Array<{ value: number | null; date: string }> | undefined,
    ];
    const rows = json[1] ?? [];
    const hit = rows.find((r) => r.value != null);
    return hit?.value ?? null;
  }).catch(() => null);
}

export async function fetchKathmanduAqi(
  token?: string,
): Promise<number | null> {
  if (!token) return null;
  return cachedFetch("waqi-ktm", 15 * 60 * 1000, async () => {
    const url = `https://api.waqi.info/feed/kathmandu/?token=${token}`;
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { aqi?: number | string } };
    const aqi = json.data?.aqi;
    return typeof aqi === "number" ? aqi : Number(aqi) || null;
  }).catch(() => null);
}
