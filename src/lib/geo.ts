/** District name aliases between geojson labels and census seed keys. */
import type { Geometry, Position } from "geojson";

const DISTRICT_ALIASES: Record<string, string> = {
  "EASTERN RUKUM": "RUKUM_E",
  "WESTERN RUKUM": "RUKUM_W",
  NAWALPUR: "NAWALPARASI_E",
  PARASI: "NAWALPARASI_W",
  TEHRATHUM: "TERHATHUM",
  KAVREPALANCHOWK: "KAVREPALANCHOK",
};

export function normalizeDistrictKey(raw: string): string {
  const upper = raw.trim().toUpperCase().replace(/\s+/g, " ");
  return DISTRICT_ALIASES[upper] ?? upper.replace(/ /g, "_");
}

export function displayDistrictName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ringAreaKm2(ring: Position[]): number {
  if (ring.length < 3) return 0;
  const lat0 = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const mPerDegLat = 111_320;
  const mPerDegLon = 111_320 * Math.cos((lat0 * Math.PI) / 180);
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const x1 = ring[i][0] * mPerDegLon;
    const y1 = ring[i][1] * mPerDegLat;
    const x2 = ring[i + 1][0] * mPerDegLon;
    const y2 = ring[i + 1][1] * mPerDegLat;
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2 / 1e6;
}

function polygonRings(geometry: Geometry): Position[][] {
  if (geometry.type === "Polygon") return [geometry.coordinates[0]];
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map((poly) => poly[0]);
  }
  return [];
}

export function featureAreaKm2(geometry: Geometry): number {
  return polygonRings(geometry).reduce((s, ring) => s + ringAreaKm2(ring), 0);
}

export function featureCentroid(
  geometry: Geometry,
): [number, number] | null {
  const rings = polygonRings(geometry);
  if (!rings.length) return null;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      sx += x;
      sy += y;
      n += 1;
    }
  }
  if (!n) return null;
  return [sx / n, sy / n];
}

export function titleCaseHq(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
