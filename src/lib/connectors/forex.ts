import type { ForexRate } from "../types";
import { cachedFetch } from "./cache";
import { fetchNrbForex } from "./nrb";

const MAJORS = ["USD", "EUR", "GBP", "JPY", "CNY", "INR", "AUD", "CAD"];

/** Frankfurter free FX (ECB) — no key required. */
export async function fetchFrankfurterForex(
  baseCurrency?: string | null,
): Promise<ForexRate[]> {
  const base = (baseCurrency || "USD").toUpperCase();
  return cachedFetch(`fx-${base}`, 60 * 60 * 1000, async () => {
    const from = base === "USD" ? "EUR" : "USD";
    const res = await fetch(`https://api.frankfurter.app/latest?from=${from}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
    const json = (await res.json()) as {
      base: string;
      rates: Record<string, number>;
    };
    const rates = json.rates ?? {};
    const out: ForexRate[] = [];

    // Always include USD and a few majors priced in the quote currency.
    for (const iso3 of MAJORS) {
      if (iso3 === json.base) continue;
      const rate = rates[iso3];
      if (rate == null) continue;
      out.push({
        currency: iso3,
        iso3,
        unit: 1,
        buy: rate * 0.998,
        sell: rate * 1.002,
      });
    }

    if (base !== "USD" && rates[base] != null) {
      // Express local currency per 1 USD when possible.
      const perUsd = from === "USD" ? rates[base]! : 1 / rates[base]!;
      out.unshift({
        currency: base,
        iso3: base,
        unit: 1,
        buy: perUsd * 0.998,
        sell: perUsd * 1.002,
      });
    }

    return out.slice(0, 8);
  }).catch(() => []);
}

export async function fetchCountryForex(
  countryCode: string,
  currency?: string | null,
): Promise<ForexRate[]> {
  if (countryCode.toLowerCase() === "np") {
    const nrb = await fetchNrbForex();
    return nrb.filter((r) =>
      ["USD", "INR", "EUR", "CNY", "GBP", "JPY"].includes(r.iso3),
    );
  }
  return fetchFrankfurterForex(currency);
}
