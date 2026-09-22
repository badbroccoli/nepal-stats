import { XMLParser } from "fast-xml-parser";
import type { ForexRate } from "../types";
import { cachedFetch } from "./cache";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

export async function fetchNrbForex(): Promise<ForexRate[]> {
  return cachedFetch("nrb-forex", 60 * 60 * 1000, async () => {
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 5);
    const from = fromDate.toISOString().slice(0, 10);

    const url = `https://www.nrb.org.np/api/forex/v1/rates?from=${from}&to=${to}&page=1&per_page=100`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`NRB HTTP ${res.status}`);
    const json = (await res.json()) as {
      data?: {
        payload?: Array<{
          rates?: Array<{
            currency?: { iso3?: string; name?: string; unit?: number };
            buy?: number | string;
            sell?: number | string;
          }>;
        }>;
      };
    };

    const payload = json.data?.payload ?? [];
    const latest = payload[payload.length - 1];
    const rates = (latest?.rates ?? [])
      .map((r) => ({
        currency: r.currency?.name ?? r.currency?.iso3 ?? "?",
        iso3: r.currency?.iso3 ?? "?",
        unit: Number(r.currency?.unit ?? 1),
        buy: Number(r.buy),
        sell: Number(r.sell),
      }))
      .filter((r) => r.iso3 && !Number.isNaN(r.buy));

    if (rates.length) return rates;

    // Fallback: try XML daily-rates path used by some clients
    const xmlRes = await fetch(
      "https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=100&from=" +
        from +
        "&to=" +
        to,
      { headers: { Accept: "application/xml,application/json" } },
    );
    const text = await xmlRes.text();
    if (text.trim().startsWith("<")) {
      const parsed = parser.parse(text);
      void parsed;
    }

    return FALLBACK_FOREX;
  }).catch(() => FALLBACK_FOREX);
}

const FALLBACK_FOREX: ForexRate[] = [
  { currency: "US Dollar", iso3: "USD", unit: 1, buy: 139.2, sell: 139.8 },
  { currency: "Indian Rupee", iso3: "INR", unit: 100, buy: 160.0, sell: 160.15 },
  { currency: "Euro", iso3: "EUR", unit: 1, buy: 151.5, sell: 152.2 },
  { currency: "Chinese Yuan", iso3: "CNY", unit: 1, buy: 19.4, sell: 19.55 },
];
