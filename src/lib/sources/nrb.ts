import { fetchJson, withCache } from "../cache";
import { FALLBACK_FOREX_USD } from "../fixtures";

interface NrbRate {
  currency: { iso3: string; name: string; unit: number };
  buy: string;
  sell: string;
}
interface NrbDay {
  date: string;
  published_on: string;
  rates: NrbRate[];
}
interface NrbResponse {
  data: { payload: NrbDay[] | null };
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function loadUsdSell(): Promise<{ value: number; date: string }> {
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 3600_000);
  const url = `https://www.nrb.org.np/api/forex/v1/rates?from=${ymd(from)}&to=${ymd(
    to,
  )}&per_page=100&page=1`;
  const res = await fetchJson<NrbResponse>(url);
  const days = res.data.payload ?? [];
  if (days.length === 0) throw new Error("NRB returned no forex days");
  const latest = days[days.length - 1];
  const usd = latest.rates.find((r) => r.currency.iso3 === "USD");
  if (!usd) throw new Error("NRB latest day missing USD rate");
  return { value: Number(usd.sell), date: latest.date };
}

export async function getUsdRate(): Promise<{ value: number; date: string; stale: boolean }> {
  const { value, stale } = await withCache("nrb:usd", 6 * 3600_000, loadUsdSell).catch(() => ({
    value: { value: FALLBACK_FOREX_USD, date: "cached" },
    stale: true,
  }));
  return { ...value, stale };
}
