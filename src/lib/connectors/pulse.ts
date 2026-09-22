import { countryBBox, getCountry, type Country } from "../countries";
import { domainsFor } from "../domains";
import type { DisasterIncident, DomainId, Metric, PulsePayload } from "../types";
import { fetchDisasterSnapshot } from "./bipad";
import { fetchCountryForex } from "./forex";
import { fetchCountryNews } from "./news";
import { fetchEarthquakesInBBox } from "./usgs";
import {
  fetchKathmanduAqi,
  fetchWorldBankIndicator,
  fetchWorldBankPopulation,
} from "./worldbank";
import {
  DOMAIN_METRICS,
  estimatePopulation,
  CENSUS_POPULATION_2021,
} from "../seed/metrics";

function quakesAsIncidents(
  quakes: Awaited<ReturnType<typeof fetchEarthquakesInBBox>>,
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

function genericMetrics(country: Country, wbPop: number | null, now: string): Metric[] {
  const pop = wbPop ?? country.population ?? 0;
  return [
    {
      key: "population",
      label: "Population",
      value: pop,
      freshness: wbPop != null ? "P" : "E",
      source: wbPop != null ? "World Bank" : "RestCountries estimate",
      asOf: now,
      format: "number",
    },
    {
      key: "area",
      label: "Land area",
      value: country.areaKm2 ?? 0,
      unit: "km²",
      freshness: "P",
      source: "Country registry",
      asOf: now,
      format: "compact",
    },
    {
      key: "region",
      label: "Region",
      value: country.subregion || country.region || "—",
      freshness: "P",
      source: "Country registry",
      asOf: now,
      format: "raw",
    },
    {
      key: "capital",
      label: "Capital",
      value: country.capital || "—",
      freshness: "P",
      source: "Country registry",
      asOf: now,
      format: "raw",
    },
  ];
}

export async function buildPulse(countryCode = "np"): Promise<PulsePayload> {
  const code = countryCode.toLowerCase();
  const country = getCountry(code);
  if (!country) {
    throw new Error(`Unknown country ${code}`);
  }

  const now = new Date().toISOString();
  const bbox = countryBBox(country);

  if (code === "np") {
    const [forex, quakes, news, wbPop, aqi, disasterSnap] = await Promise.all([
      fetchCountryForex("np"),
      fetchEarthquakesInBBox(bbox),
      fetchCountryNews("np", country.name),
      fetchWorldBankPopulation(country.iso3),
      fetchKathmanduAqi(process.env.WAQI_TOKEN),
      fetchDisasterSnapshot(30),
    ]);

    const populationEstimate = estimatePopulation();
    const economy = [...DOMAIN_METRICS.economy];
    const environment = [...DOMAIN_METRICS.environment];
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
      forex,
      quakes: quakes.slice(0, 12),
      disasters: mergedDisasters,
      news: news.slice(0, 24),
      domains: domainsFor("np"),
    };
  }

  // Generic country pulse — live WB / USGS / FX / news where possible.
  const [forex, quakes, news, wbPop, gdpGrowth, lifeExp] = await Promise.all([
    fetchCountryForex(code, country.currency),
    fetchEarthquakesInBBox(bbox),
    fetchCountryNews(code, country.name),
    fetchWorldBankPopulation(country.iso3),
    fetchWorldBankIndicator(country.iso3, "NY.GDP.MKTP.KD.ZG", "gdp-growth"),
    fetchWorldBankIndicator(country.iso3, "SP.DYN.LE00.IN", "life-exp"),
  ]);

  const populationEstimate = wbPop ?? country.population ?? 0;
  const base = genericMetrics(country, wbPop, now);
  const extras: Metric[] = [
    {
      key: "quakes_30d",
      label: "Quakes (bbox, recent)",
      value: quakes.length,
      freshness: "RT",
      source: "USGS",
      asOf: now,
      format: "number",
    },
  ];
  if (gdpGrowth != null) {
    extras.push({
      key: "gdp_growth",
      label: "GDP growth",
      value: Math.round(gdpGrowth * 10) / 10,
      unit: "%",
      freshness: "P",
      source: "World Bank",
      asOf: now,
      format: "percent",
    });
  }
  if (lifeExp != null) {
    extras.push({
      key: "life_exp",
      label: "Life expectancy",
      value: Math.round(lifeExp * 10) / 10,
      unit: "years",
      freshness: "P",
      source: "World Bank",
      asOf: now,
      format: "raw",
    });
  }
  if (country.currency) {
    const local = forex.find((r) => r.iso3 === country.currency);
    if (local) {
      extras.unshift({
        key: "fx_local",
        label: `${country.currency} / USD`,
        value: local.sell,
        freshness: "NR",
        source: "Frankfurter / ECB",
        asOf: now,
        format: "raw",
      });
    }
  }

  return {
    generatedAt: now,
    populationEstimate,
    populationAsOf: now,
    metrics: [...base, ...extras].slice(0, 8),
    forex,
    quakes: quakes.slice(0, 12),
    disasters: quakesAsIncidents(quakes).slice(0, 20),
    news: news.slice(0, 24),
    domains: domainsFor(code),
  };
}

export function getDomainMetrics(domain: DomainId): Metric[] {
  // Legacy sync helper — Nepal curated seed only.
  // Prefer getCountryDomainMetrics(domain, country) for country-aware pages.
  return DOMAIN_METRICS[domain] ?? [];
}
