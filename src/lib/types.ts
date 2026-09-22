export type Freshness = "official" | "estimated" | "near-real-time" | "daily" | "unknown";

export interface SourceMeta {
  source: string;
  sourceUrl?: string;
  observedAt: string | null;
  ingestedAt: string;
  freshness: Freshness;
  stale: boolean;
}

export interface Kpi<T = number> extends SourceMeta {
  key: string;
  label: string;
  value: T;
  unit?: string;
  note?: string;
}

export interface DisasterEvent {
  id: string;
  type: "earthquake";
  magnitude: number;
  depthKm: number | null;
  place: string;
  lat: number;
  lon: number;
  observedAt: string;
  url?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
  summary?: string;
}

export interface NationalKpis {
  population: Kpi;
  crudeBirthRate: Kpi;
  forexUsd: Kpi;
  earthquakes24h: Kpi;
  generatedAt: string;
}
