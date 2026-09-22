import countriesJson from "@/data/countries.json";

export type Country = {
  code: string;
  iso3: string;
  name: string;
  official: string;
  capital?: string | null;
  region: string;
  subregion: string;
  lat: number;
  lng: number;
  currency?: string | null;
  population?: number | null;
  areaKm2?: number | null;
  flag: string;
};

export const COUNTRIES = countriesJson as Country[];

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code: string | undefined | null): Country | null {
  if (!code) return null;
  return BY_CODE.get(code.toLowerCase()) ?? null;
}

export function requireCountry(code: string): Country {
  const c = getCountry(code);
  if (!c) throw new Error(`Unknown country: ${code}`);
  return c;
}

export function isCountryCode(value: string): boolean {
  return BY_CODE.has(value.toLowerCase());
}

export function countryPath(code: string, segment = ""): string {
  const base = `/${code.toLowerCase()}`;
  if (!segment || segment === "/") return base;
  return `${base}/${segment.replace(/^\//, "")}`;
}

export function countriesByRegion(): Record<string, Country[]> {
  const groups: Record<string, Country[]> = {};
  for (const c of COUNTRIES) {
    const key = c.region || "Other";
    (groups[key] ??= []).push(c);
  }
  return groups;
}

/** Approximate geographic window for USGS / map framing. */
export function countryBBox(c: Country): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  // Scale pad by country size — small nations need less span than continents.
  const area = c.areaKm2 ?? 100_000;
  const pad = Math.min(12, Math.max(1.2, Math.sqrt(area) / 180));
  return {
    minLat: c.lat - pad,
    maxLat: c.lat + pad,
    minLon: c.lng - pad,
    maxLon: c.lng + pad,
  };
}
