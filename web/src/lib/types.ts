export type Freshness = "RT" | "NR" | "P" | "E";

export type DomainId =
  | "people"
  | "economy"
  | "government"
  | "health"
  | "education"
  | "energy"
  | "environment"
  | "disasters"
  | "tourism"
  | "digital"
  | "transport"
  | "agriculture"
  | "migration"
  | "places"
  | "news";

export interface Metric {
  key: string;
  label: string;
  labelNp?: string;
  value: number | string;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  freshness: Freshness;
  source: string;
  asOf: string;
  description?: string;
  format?: "number" | "compact" | "percent" | "currency" | "raw";
}

export interface DomainMeta {
  id: DomainId;
  href: string;
  title: string;
  titleNp: string;
  blurb: string;
  accent: string;
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  summary?: string;
}

export interface QuakeEvent {
  id: string;
  mag: number;
  place: string;
  time: string;
  lat: number;
  lon: number;
  depth: number;
  url: string;
}

export interface ForexRate {
  currency: string;
  iso3: string;
  unit: number;
  buy: number;
  sell: number;
}

export interface DistrictStat {
  name: string;
  province: number;
  population: number;
  density?: number;
}

export interface PulsePayload {
  generatedAt: string;
  populationEstimate: number;
  populationAsOf: string;
  metrics: Metric[];
  forex: ForexRate[];
  quakes: QuakeEvent[];
  news: NewsItem[];
  domains: DomainMeta[];
}
