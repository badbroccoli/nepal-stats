import { cachedFetch } from "./cache";
import { fetchWorldBankIndicator, fetchWorldBankPopulation } from "./worldbank";
import type { Country } from "../countries";
import type { DomainId, Metric } from "../types";
import { DOMAIN_METRICS } from "../seed/metrics";

type IndicatorDef = {
  key: string;
  label: string;
  indicator: string;
  unit?: string;
  format?: Metric["format"];
};

const DOMAIN_INDICATORS: Partial<Record<DomainId, IndicatorDef[]>> = {
  people: [
    { key: "pop", label: "Population", indicator: "SP.POP.TOTL", format: "number" },
    {
      key: "urban",
      label: "Urban population",
      indicator: "SP.URB.TOTL.IN.ZS",
      unit: "%",
      format: "percent",
    },
    {
      key: "life_exp",
      label: "Life expectancy",
      indicator: "SP.DYN.LE00.IN",
      unit: "years",
      format: "raw",
    },
    {
      key: "cbr",
      label: "Birth rate",
      indicator: "SP.DYN.CBRT.IN",
      unit: "per 1,000",
      format: "raw",
    },
    {
      key: "cdr",
      label: "Death rate",
      indicator: "SP.DYN.CDRT.IN",
      unit: "per 1,000",
      format: "raw",
    },
    {
      key: "literacy",
      label: "Adult literacy",
      indicator: "SE.ADT.LITR.ZS",
      unit: "%",
      format: "percent",
    },
  ],
  economy: [
    {
      key: "gdp",
      label: "GDP (current US$)",
      indicator: "NY.GDP.MKTP.CD",
      format: "compact",
    },
    {
      key: "gdp_pc",
      label: "GDP per capita",
      indicator: "NY.GDP.PCAP.CD",
      format: "compact",
      unit: "US$",
    },
    {
      key: "gdp_g",
      label: "GDP growth",
      indicator: "NY.GDP.MKTP.KD.ZG",
      unit: "%",
      format: "percent",
    },
    {
      key: "cpi",
      label: "Inflation (CPI)",
      indicator: "FP.CPI.TOTL.ZG",
      unit: "%",
      format: "percent",
    },
    {
      key: "remit",
      label: "Remittances received",
      indicator: "BX.TRF.PWKR.CD.DT",
      format: "compact",
      unit: "US$",
    },
    {
      key: "unemp",
      label: "Unemployment",
      indicator: "SL.UEM.TOTL.ZS",
      unit: "%",
      format: "percent",
    },
  ],
  government: [
    {
      key: "tax",
      label: "Tax revenue",
      indicator: "GC.TAX.TOTL.GD.ZS",
      unit: "% of GDP",
      format: "percent",
    },
    {
      key: "debt",
      label: "Central gov debt",
      indicator: "GC.DOD.TOTL.GD.ZS",
      unit: "% of GDP",
      format: "percent",
    },
    {
      key: "expense",
      label: "Expense",
      indicator: "GC.XPN.TOTL.GD.ZS",
      unit: "% of GDP",
      format: "percent",
    },
  ],
  health: [
    {
      key: "life_exp",
      label: "Life expectancy",
      indicator: "SP.DYN.LE00.IN",
      unit: "years",
      format: "raw",
    },
    {
      key: "mort",
      label: "Under-5 mortality",
      indicator: "SH.DYN.MORT",
      unit: "per 1,000",
      format: "raw",
    },
    {
      key: "hexp",
      label: "Health expenditure",
      indicator: "SH.XPD.CHEX.GD.ZS",
      unit: "% of GDP",
      format: "percent",
    },
    {
      key: "phys",
      label: "Physicians",
      indicator: "SH.MED.PHYS.ZS",
      unit: "per 1,000",
      format: "raw",
    },
  ],
  education: [
    {
      key: "prim",
      label: "Primary enrollment",
      indicator: "SE.PRM.ENRR",
      unit: "%",
      format: "percent",
    },
    {
      key: "sec",
      label: "Secondary enrollment",
      indicator: "SE.SEC.ENRR",
      unit: "%",
      format: "percent",
    },
    {
      key: "tert",
      label: "Tertiary enrollment",
      indicator: "SE.TER.ENRR",
      unit: "%",
      format: "percent",
    },
    {
      key: "literacy",
      label: "Adult literacy",
      indicator: "SE.ADT.LITR.ZS",
      unit: "%",
      format: "percent",
    },
  ],
  energy: [
    {
      key: "access",
      label: "Electricity access",
      indicator: "EG.ELC.ACCS.ZS",
      unit: "%",
      format: "percent",
    },
    {
      key: "use",
      label: "Electric power use",
      indicator: "EG.USE.ELEC.KH.PC",
      unit: "kWh/person",
      format: "compact",
    },
    {
      key: "renew",
      label: "Renewable energy share",
      indicator: "EG.FEC.RNEW.ZS",
      unit: "%",
      format: "percent",
    },
  ],
  environment: [
    {
      key: "forest",
      label: "Forest area",
      indicator: "AG.LND.FRST.ZS",
      unit: "% of land",
      format: "percent",
    },
    {
      key: "co2",
      label: "CO₂ emissions",
      indicator: "EN.ATM.CO2E.PC",
      unit: "t/person",
      format: "raw",
    },
    {
      key: "pm25",
      label: "PM2.5 exposure",
      indicator: "EN.ATM.PM25.MC.M3",
      unit: "µg/m³",
      format: "raw",
    },
  ],
  tourism: [
    {
      key: "arrivals",
      label: "International arrivals",
      indicator: "ST.INT.ARVL",
      format: "compact",
    },
    {
      key: "receipts",
      label: "Tourism receipts",
      indicator: "ST.INT.RCPT.CD",
      format: "compact",
      unit: "US$",
    },
  ],
  digital: [
    {
      key: "internet",
      label: "Internet users",
      indicator: "IT.NET.USER.ZS",
      unit: "%",
      format: "percent",
    },
    {
      key: "mobile",
      label: "Mobile subscriptions",
      indicator: "IT.CEL.SETS.P2",
      unit: "per 100",
      format: "raw",
    },
    {
      key: "bb",
      label: "Fixed broadband",
      indicator: "IT.NET.BBND.P2",
      unit: "per 100",
      format: "raw",
    },
  ],
  transport: [
    {
      key: "air",
      label: "Air passengers",
      indicator: "IS.AIR.PSGR",
      format: "compact",
    },
    {
      key: "rail",
      label: "Rail lines",
      indicator: "IS.RRS.TOTL.KM",
      unit: "km",
      format: "compact",
    },
  ],
  agriculture: [
    {
      key: "agland",
      label: "Agricultural land",
      indicator: "AG.LND.AGRI.ZS",
      unit: "%",
      format: "percent",
    },
    {
      key: "cereal",
      label: "Cereal production",
      indicator: "AG.PRD.CREL.MT",
      unit: "metric tons",
      format: "compact",
    },
    {
      key: "food",
      label: "Food production index",
      indicator: "AG.PRD.FOOD.XD",
      format: "raw",
    },
  ],
  migration: [
    {
      key: "net",
      label: "Net migration",
      indicator: "SM.POP.NETM",
      format: "compact",
    },
    {
      key: "remit",
      label: "Remittances",
      indicator: "BX.TRF.PWKR.CD.DT",
      format: "compact",
      unit: "US$",
    },
    {
      key: "refugee",
      label: "Refugee population",
      indicator: "SM.POP.REFG",
      format: "compact",
    },
  ],
  disasters: [
    // Filled live with USGS counts in the disasters page
  ],
};

async function fetchIndicatorMetric(
  iso3: string,
  def: IndicatorDef,
  now: string,
): Promise<Metric | null> {
  const value = await fetchWorldBankIndicator(
    iso3,
    def.indicator,
    `${def.key}-${iso3}`,
  );
  if (value == null) return null;
  return {
    key: def.key,
    label: def.label,
    value: typeof value === "number" ? Math.round(value * 100) / 100 : value,
    unit: def.unit,
    freshness: "P",
    source: "World Bank",
    asOf: now,
    format: def.format ?? "number",
  };
}

/** Nepal keeps curated seed metrics; other countries use World Bank indicators. */
export async function getCountryDomainMetrics(
  domain: DomainId,
  country: Country,
): Promise<Metric[]> {
  if (country.code === "np") {
    return DOMAIN_METRICS[domain] ?? [];
  }

  const defs = DOMAIN_INDICATORS[domain];
  if (!defs?.length) {
    // Registry basics for domains without WB series (places/news)
    if (domain === "places" || domain === "news") return [];
    const now = new Date().toISOString();
    const pop = await fetchWorldBankPopulation(country.iso3);
    const base: Metric[] = [
      {
        key: "population",
        label: "Population",
        value: pop ?? country.population ?? 0,
        freshness: pop != null ? "P" : "E",
        source: pop != null ? "World Bank" : "Country registry",
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
    ];
    return base;
  }

  return cachedFetch(
    `domain-metrics-${country.code}-${domain}`,
    12 * 60 * 60 * 1000,
    async () => {
      const now = new Date().toISOString();
      const results = await Promise.all(
        defs.map((d) => fetchIndicatorMetric(country.iso3, d, now)),
      );
      return results.filter((m): m is Metric => m != null);
    },
  ).catch(() => []);
}
