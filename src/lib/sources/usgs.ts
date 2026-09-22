import { fetchJson, withCache } from "../cache";
import { FALLBACK_EARTHQUAKES } from "../fixtures";
import type { DisasterEvent } from "../types";

const NEPAL_BBOX = { minLat: 26, maxLat: 31, minLon: 80, maxLon: 89 };

interface UsgsFeature {
  id: string;
  properties: { mag: number | null; place: string | null; time: number; url?: string };
  geometry: { coordinates: [number, number, number] };
}
interface UsgsResponse {
  features: UsgsFeature[];
}

function usgsUrl(sinceHours: number): string {
  const start = new Date(Date.now() - sinceHours * 3600_000).toISOString();
  const p = new URLSearchParams({
    format: "geojson",
    starttime: start,
    minlatitude: String(NEPAL_BBOX.minLat),
    maxlatitude: String(NEPAL_BBOX.maxLat),
    minlongitude: String(NEPAL_BBOX.minLon),
    maxlongitude: String(NEPAL_BBOX.maxLon),
    orderby: "time",
  });
  return `https://earthquake.usgs.gov/fdsnws/event/1/query?${p.toString()}`;
}

function normalize(res: UsgsResponse): DisasterEvent[] {
  return res.features
    .filter((f) => f.properties.mag != null)
    .map((f) => ({
      id: f.id,
      type: "earthquake" as const,
      magnitude: Number(f.properties.mag),
      depthKm: f.geometry.coordinates[2] ?? null,
      place: f.properties.place ?? "Unknown location",
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      observedAt: new Date(f.properties.time).toISOString(),
      url: f.properties.url,
    }));
}

export async function getEarthquakes(
  sinceHours = 168,
): Promise<{ events: DisasterEvent[]; stale: boolean }> {
  const { value, stale } = await withCache(
    `usgs:${sinceHours}`,
    45_000,
    async () => normalize(await fetchJson<UsgsResponse>(usgsUrl(sinceHours))),
  ).catch(() => ({ value: FALLBACK_EARTHQUAKES, stale: true }));
  return { events: value, stale };
}
