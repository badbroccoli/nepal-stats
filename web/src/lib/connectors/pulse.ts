import { DOMAINS } from "../domains";
import type { DomainId, Metric, PulsePayload } from "../types";
import { fetchNepalNews } from "./news";
import { fetchNrbForex } from "./nrb";
import { fetchNepalEarthquakes } from "./usgs";
import { fetchKathmanduAqi, fetchWorldBankPopulation } from "./worldbank";
import {
  DOMAIN_METRICS,
  estimatePopulation,
  CENSUS_POPULATION_2021,
} from "../seed/metrics";

export async function buildPulse(): Promise<PulsePayload> {
  const [forex, quakes, news, wbPop, aqi] = await Promise.all([
    fetchNrbForex(),
    fetchNepalEarthquakes(),
    fetchNepalNews(),
    fetchWorldBankPopulation(),
    fetchKathmanduAqi(process.env.WAQI_TOKEN),
  ]);

  const populationEstimate = estimatePopulation();
  const economy = [...DOMAIN_METRICS.economy];
  const environment = [...DOMAIN_METRICS.environment];
  const disasters = DOMAIN_METRICS.disasters.map((m) =>
    m.key === "quakes_30d"
      ? { ...m, value: quakes.length, asOf: new Date().toISOString() }
      : m,
  );

  if (aqi != null) {
    const idx = environment.findIndex((m) => m.key === "ktm_aqi");
    if (idx >= 0) {
      environment[idx] = {
        ...environment[idx],
        value: aqi,
        asOf: new Date().toISOString(),
        source: "WAQI",
      };
    }
  }

  const usd = forex.find((r) => r.iso3 === "USD");
  const pulseMetrics: Metric[] = [
    {
      key: "population",
      label: "Population (est.)",
      value: populationEstimate,
      freshness: "E",
      source: `NSO census ${CENSUS_POPULATION_2021.toLocaleString()} + growth model`,
      asOf: new Date().toISOString(),
      format: "number",
      description:
        wbPop != null
          ? `World Bank latest official: ${wbPop.toLocaleString()}`
          : "Estimated from NPHC 2021 baseline",
    },
    {
      key: "usd_npr",
      label: "USD / NPR (sell)",
      value: usd?.sell ?? 139.8,
      freshness: "NR",
      source: "NRB Forex API",
      asOf: new Date().toISOString(),
      format: "raw",
    },
    economy.find((m) => m.key === "cpi")!,
    economy.find((m) => m.key === "remittance")!,
    economy.find((m) => m.key === "nepse")!,
    environment.find((m) => m.key === "ktm_aqi")!,
    disasters.find((m) => m.key === "quakes_30d")!,
    DOMAIN_METRICS.tourism.find((m) => m.key === "arrivals_ytd")!,
  ];

  return {
    generatedAt: new Date().toISOString(),
    populationEstimate,
    populationAsOf: new Date().toISOString(),
    metrics: pulseMetrics,
    forex: forex.filter((r) =>
      ["USD", "INR", "EUR", "CNY", "GBP", "JPY"].includes(r.iso3),
    ),
    quakes: quakes.slice(0, 12),
    news: news.slice(0, 15),
    domains: DOMAINS,
  };
}

export function getDomainMetrics(domain: DomainId): Metric[] {
  return DOMAIN_METRICS[domain] ?? [];
}
