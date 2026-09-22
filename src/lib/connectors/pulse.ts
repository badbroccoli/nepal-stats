import { DOMAINS } from "../domains";
import type { DisasterIncident, DomainId, Metric, PulsePayload } from "../types";
import { fetchDisasterSnapshot } from "./bipad";
import { fetchNepalNews } from "./news";
import { fetchNrbForex } from "./nrb";
import { fetchNepalEarthquakes } from "./usgs";
import { fetchKathmanduAqi, fetchWorldBankPopulation } from "./worldbank";
import {
  DOMAIN_METRICS,
  estimatePopulation,
  CENSUS_POPULATION_2021,
} from "../seed/metrics";

function quakesAsIncidents(
  quakes: Awaited<ReturnType<typeof fetchNepalEarthquakes>>,
): DisasterIncident[] {
  return quakes.map((q) => ({
    id: `usgs-${q.id}`,
    source: "usgs" as const,
    hazardId: 8,
    hazard: "Earthquake",
    hazardColor: "#FF6B6B",
    title: `M${q.mag} · ${q.place}`,
    time: q.time,
    lat: q.lat,
    lon: q.lon,
    url: q.url,
    mag: q.mag,
    depth: q.depth,
  }));
}

export async function buildPulse(): Promise<PulsePayload> {
  const [forex, quakes, news, wbPop, aqi, disasterSnap] = await Promise.all([
    fetchNrbForex(),
    fetchNepalEarthquakes(),
    fetchNepalNews(),
    fetchWorldBankPopulation(),
    fetchKathmanduAqi(process.env.WAQI_TOKEN),
    fetchDisasterSnapshot(30),
  ]);

  const populationEstimate = estimatePopulation();
  const economy = [...DOMAIN_METRICS.economy];
  const environment = [...DOMAIN_METRICS.environment];
  const now = new Date().toISOString();
  const disasters = DOMAIN_METRICS.disasters.map((m) => {
    if (m.key === "incidents_30d") {
      return { ...m, value: disasterSnap.incidents.length, asOf: now };
    }
    if (m.key === "quakes_30d") {
      return { ...m, value: quakes.length, asOf: now };
    }
    if (m.key === "active_alerts") {
      return { ...m, value: disasterSnap.alerts.length, asOf: now };
    }
    if (m.key === "flood_stations") {
      return { ...m, value: disasterSnap.rivers.monitored, asOf: now };
    }
    if (m.key === "rivers_elevated") {
      return { ...m, value: disasterSnap.rivers.elevated, asOf: now };
    }
    return m;
  });

  if (aqi != null) {
    const idx = environment.findIndex((m) => m.key === "ktm_aqi");
    if (idx >= 0) {
      environment[idx] = {
        ...environment[idx],
        value: aqi,
        asOf: now,
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
      asOf: now,
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
      asOf: now,
      format: "raw",
    },
    economy.find((m) => m.key === "cpi")!,
    economy.find((m) => m.key === "remittance")!,
    economy.find((m) => m.key === "nepse")!,
    environment.find((m) => m.key === "ktm_aqi")!,
    disasters.find((m) => m.key === "incidents_30d")!,
    DOMAIN_METRICS.tourism.find((m) => m.key === "arrivals_ytd")!,
  ];

  const bipadIds = new Set(disasterSnap.incidents.map((i) => i.id));
  const mergedDisasters = [
    ...disasterSnap.incidents,
    ...quakesAsIncidents(quakes).filter((q) => !bipadIds.has(q.id)),
  ]
    .sort((a, b) => +new Date(b.time) - +new Date(a.time))
    .slice(0, 20);

  return {
    generatedAt: now,
    populationEstimate,
    populationAsOf: now,
    metrics: pulseMetrics,
    forex: forex.filter((r) =>
      ["USD", "INR", "EUR", "CNY", "GBP", "JPY"].includes(r.iso3),
    ),
    quakes: quakes.slice(0, 12),
    disasters: mergedDisasters,
    news: news.slice(0, 15),
    domains: DOMAINS,
  };
}

export function getDomainMetrics(domain: DomainId): Metric[] {
  return DOMAIN_METRICS[domain] ?? [];
}
