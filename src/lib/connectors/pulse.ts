import { countryBBox, getCountry, type Country } from "../countries";
import { domainsFor } from "../domains";
import type { DisasterIncident, DomainId, Metric, PulsePayload } from "../types";
import { fetchCountryForex } from "./forex";
import { fetchCountryNews } from "./news";
import { resolveOfficialPopulation } from "./officialStats";
import { fetchEarthquakesInBBox } from "./usgs";
import {
  fetchWorldBankIndicator,
  fetchWorldBankPopulation,
} from "./worldbank";
import { DOMAIN_METRICS } from "../seed/metrics";

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

function baseRegistryMetrics(
  country: Country,
  pop: { value: number; source: string; freshness: Metric["freshness"]; asOf: string },
): Metric[] {
  return [
    {
      key: "population",
      label: "Population",
      value: pop.value,
      freshness: pop.freshness,
      source: pop.source,
      asOf: pop.asOf,
      format: "number",
    },
    {
      key: "area",
      label: "Land area",
      value: country.areaKm2 ?? 0,
      unit: "km²",
      freshness: "P",
      source: "Country registry",
      asOf: pop.asOf,
      format: "compact",
    },
    {
      key: "region",
      label: "Region",
      value: country.subregion || country.region || "—",
      freshness: "P",
      source: "Country registry",
      asOf: pop.asOf,
      format: "raw",
    },
    {
      key: "capital",
      label: "Capital",
      value: country.capital || "—",
      freshness: "P",
      source: "Country registry",
      asOf: pop.asOf,
      format: "raw",
    },
  ];
}

/** National pulse for any ISO2 — official sources preferred, then WB/USGS/FX/news. */
export async function buildPulse(countryCode = "us"): Promise<PulsePayload> {
  const code = countryCode.toLowerCase();
  const country = getCountry(code);
  if (!country) {
    throw new Error(`Unknown country ${code}`);
  }

  const now = new Date().toISOString();
  const bbox = countryBBox(country);

  const [forex, quakes, news, wbPop, gdpGrowth, lifeExp, internet] =
    await Promise.all([
      fetchCountryForex(code, country.currency),
      fetchEarthquakesInBBox(bbox),
      fetchCountryNews(code, country.name),
      fetchWorldBankPopulation(country.iso3),
      fetchWorldBankIndicator(country.iso3, "NY.GDP.MKTP.KD.ZG", "gdp-growth"),
      fetchWorldBankIndicator(country.iso3, "SP.DYN.LE00.IN", "life-exp"),
      fetchWorldBankIndicator(country.iso3, "IT.NET.USER.ZS", "internet"),
    ]);

  const officialPop = await resolveOfficialPopulation(code, wbPop);
  const populationEstimate =
    officialPop?.value ?? wbPop ?? country.population ?? 0;

  const base = baseRegistryMetrics(country, {
    value: populationEstimate,
    source: officialPop?.source ?? "Country registry",
    freshness: officialPop ? "P" : "E",
    asOf: officialPop?.asOf ?? now,
  });

  const extras: Metric[] = [
    {
      key: "quakes_30d",
      label: "Quakes (recent, nearby)",
      value: quakes.length,
      freshness: "RT",
      source: "USGS",
      asOf: now,
      format: "number",
    },
  ];

  if (country.currency) {
    const local = forex.find((r) => r.iso3 === country.currency);
    if (local && country.currency !== "USD") {
      extras.unshift({
        key: "fx_local",
        label: `${country.currency} / USD`,
        value: local.sell,
        freshness: "NR",
        source: "Frankfurter / ECB",
        asOf: now,
        format: "raw",
      });
    } else if (country.currency === "USD") {
      const eur = forex.find((r) => r.iso3 === "EUR");
      if (eur) {
        extras.unshift({
          key: "fx_eur",
          label: "EUR / USD",
          value: eur.sell,
          freshness: "NR",
          source: "Frankfurter / ECB",
          asOf: now,
          format: "raw",
        });
      }
    }
  }

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
  if (internet != null) {
    extras.push({
      key: "internet",
      label: "Internet users",
      value: Math.round(internet * 10) / 10,
      unit: "%",
      freshness: "P",
      source: "World Bank",
      asOf: now,
      format: "percent",
    });
  }

  return {
    generatedAt: now,
    populationEstimate,
    populationAsOf: officialPop?.asOf ?? now,
    populationConnector: officialPop?.connector,
    metrics: [...base, ...extras].slice(0, 8),
    forex,
    quakes: quakes.slice(0, 12),
    disasters: quakesAsIncidents(quakes).slice(0, 20),
    news: news.slice(0, 24),
    domains: domainsFor(code),
  };
}

/** @deprecated Prefer getCountryDomainMetrics */
export function getDomainMetrics(domain: DomainId): Metric[] {
  return DOMAIN_METRICS[domain] ?? [];
}
