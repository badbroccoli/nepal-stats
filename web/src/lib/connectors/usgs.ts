import type { QuakeEvent } from "../types";
import { cachedFetch } from "./cache";

export async function fetchNepalEarthquakes(): Promise<QuakeEvent[]> {
  return cachedFetch("usgs-quakes", 60 * 1000, async () => {
    const url =
      "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson" +
      "&minlatitude=26&maxlatitude=31&minlongitude=80&maxlongitude=89" +
      "&orderby=time&limit=50";
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);
    const json = (await res.json()) as {
      features?: Array<{
        id: string;
        geometry: { coordinates: [number, number, number?] };
        properties: {
          mag: number;
          place: string;
          time: number;
          url: string;
          depth?: number;
        };
      }>;
    };

    return (json.features ?? []).map((f) => ({
      id: f.id,
      mag: f.properties.mag,
      place: f.properties.place,
      time: new Date(f.properties.time).toISOString(),
      lon: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
      depth: f.geometry.coordinates[2] ?? f.properties.depth ?? 0,
      url: f.properties.url,
    }));
  }).catch(() => []);
}
