import sourcesJson from "@/data/country-sources.json";

export type AgencyKind =
  | "nso"
  | "central_bank"
  | "open_data"
  | "census"
  | "health"
  | "disaster"
  | "fx"
  | "other";

export type AgencyTier = "federal" | "state" | "local" | "supranational";

export type AgencyApiType =
  | "worldbank"
  | "eurostat"
  | "census_us"
  | "statcan"
  | "ons"
  | "abs"
  | "fred"
  | "ibge"
  | "estat_jp"
  | "nrb"
  | "bipad"
  | "usgs"
  | "frankfurter";

export type AgencyRef = {
  name: string;
  url: string;
  tier: AgencyTier;
  kind: AgencyKind;
  api?: { type: AgencyApiType; notes?: string; baseUrl?: string };
  notes?: string;
};

export type CountrySourceProfile = {
  code: string;
  name: string;
  agencies: AgencyRef[];
  preferred?: {
    population?: AgencyApiType | string;
    fx?: AgencyApiType | string;
  };
};

const BY_CODE = new Map(
  Object.entries(sourcesJson as Record<string, CountrySourceProfile>).map(
    ([k, v]) => [k.toLowerCase(), v],
  ),
);

export function getCountrySources(
  code: string | undefined | null,
): CountrySourceProfile | null {
  if (!code) return null;
  return BY_CODE.get(code.toLowerCase()) ?? null;
}

export function listOfficialAgencies(code: string): AgencyRef[] {
  return getCountrySources(code)?.agencies ?? [];
}

export function agenciesWithApi(code: string): AgencyRef[] {
  return listOfficialAgencies(code).filter((a) => a.api?.type);
}

export function preferredPopulationSource(code: string): string {
  return getCountrySources(code)?.preferred?.population ?? "worldbank";
}
