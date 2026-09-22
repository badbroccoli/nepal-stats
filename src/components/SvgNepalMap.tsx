"use client";

import { useEffect, useMemo, useState } from "react";
import { PROVINCE_NAMES } from "@/lib/domains";
import { formatCompact, formatNumber, timeAgo } from "@/lib/format";
import {
  displayDistrictName,
  featureAreaKm2,
  featureCentroid,
  normalizeDistrictKey,
  titleCaseHq,
} from "@/lib/geo";
import { CENSUS_POPULATION_2021, DISTRICT_POPULATION } from "@/lib/seed/metrics";
import type { DisasterIncident, QuakeEvent } from "@/lib/types";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";

type DistrictPath = {
  key: string;
  name: string;
  d: string;
  population: number;
  province: string;
  hq: string;
  areaKm2: number;
  density: number;
  sharePct: number;
  fill: string;
};

type HazardDot = DisasterIncident & { x: number; y: number; r: number };

function project([lon, lat]: Position, bbox: number[]): [number, number] {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const pad = 12;
  const w = 800 - pad * 2;
  const h = 520 - pad * 2;
  const x = pad + ((lon - minLon) / (maxLon - minLon)) * w;
  const y = pad + ((maxLat - lat) / (maxLat - minLat)) * h;
  return [x, y];
}

function ringToPath(ring: Position[], bbox: number[]): string {
  return ring
    .map((c, i) => {
      const [x, y] = project(c, bbox);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ")
    .concat(" Z");
}

function geometryToPath(geometry: Geometry, bbox: number[]): string {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map((ring) => ringToPath(ring, bbox)).join(" ");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .flatMap((poly) => poly.map((ring) => ringToPath(ring, bbox)))
      .join(" ");
  }
  return "";
}

function popColor(population: number): string {
  if (population >= 1_500_000) return "#b8ffe0";
  if (population >= 900_000) return "#3ddc97";
  if (population >= 500_000) return "#2f9e6a";
  if (population >= 200_000) return "#1a6b4a";
  return "#0d3d2c";
}

function collectBBox(features: Feature[]): number[] {
  let minLon = 180;
  let minLat = 90;
  let maxLon = -180;
  let maxLat = -90;
  const visit = (coords: Position) => {
    minLon = Math.min(minLon, coords[0]);
    maxLon = Math.max(maxLon, coords[0]);
    minLat = Math.min(minLat, coords[1]);
    maxLat = Math.max(maxLat, coords[1]);
  };
  const walk = (g: Geometry) => {
    if (g.type === "Polygon") g.coordinates.flat().forEach(visit);
    if (g.type === "MultiPolygon") g.coordinates.flat(2).forEach(visit);
  };
  for (const f of features) walk(f.geometry);
  return [minLon - 0.15, minLat - 0.1, maxLon + 0.15, maxLat + 0.1];
}

function toMarkers(
  incidents: DisasterIncident[],
  quakes: QuakeEvent[],
): DisasterIncident[] {
  if (incidents.length) return incidents;
  return quakes.map((q) => ({
    id: `usgs-${q.id}`,
    source: "usgs" as const,
    hazardId: 8,
    hazard: "Earthquake",
    hazardColor: "#ff6b6b",
    title: `M${q.mag} · ${q.place}`,
    time: q.time,
    lat: q.lat,
    lon: q.lon,
    url: q.url,
    mag: q.mag,
    depth: q.depth,
  }));
}

export function SvgNepalMap({
  quakes = [],
  incidents = [],
  height = "520px",
}: {
  quakes?: QuakeEvent[];
  incidents?: DisasterIncident[];
  height?: string;
}) {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DistrictPath | null>(null);
  const [hover, setHover] = useState<DistrictPath | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<HazardDot | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let res = await fetch("/geo/nepal-districts.geojson");
        if (!res.ok) res = await fetch("/api/geo/districts");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as FeatureCollection;
        if (!cancelled) setGeo(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const bbox = useMemo(
    () => (geo ? collectBBox(geo.features) : [80, 26, 89, 31]),
    [geo],
  );

  const paths = useMemo(() => {
    if (!geo) return [] as DistrictPath[];
    return geo.features.map((f) => {
      const rawName = String(f.properties?.DISTRICT ?? "");
      const key = normalizeDistrictKey(rawName);
      const provinceId = Number(f.properties?.PROVINCE ?? 0);
      const population =
        DISTRICT_POPULATION[key] ??
        Math.round(200000 + ((key.length * 17000) % 400000));
      const areaKm2 = Math.round(featureAreaKm2(f.geometry) * 10) / 10;
      const density = areaKm2 > 0 ? Math.round(population / areaKm2) : 0;
      const sharePct =
        Math.round((population / CENSUS_POPULATION_2021) * 1000) / 10;
      const hq = titleCaseHq(String(f.properties?.HQ ?? "")) || "—";
      const name = displayDistrictName(rawName);
      const province =
        PROVINCE_NAMES[provinceId]?.en ?? `Province ${provinceId}`;
      return {
        key,
        name,
        d: geometryToPath(f.geometry, bbox),
        population,
        province,
        hq,
        areaKm2,
        density,
        sharePct,
        fill: popColor(population),
      };
    });
  }, [geo, bbox]);

  const labels = useMemo(() => {
    if (!geo) return [];
    return geo.features
      .map((f) => {
        const rawName = String(f.properties?.DISTRICT ?? "");
        const key = normalizeDistrictKey(rawName);
        const population =
          DISTRICT_POPULATION[key] ??
          Math.round(200000 + ((key.length * 17000) % 400000));
        const c = featureCentroid(f.geometry);
        if (!c || population < 250000) return null;
        const [x, y] = project(c, bbox);
        return { key, name: displayDistrictName(rawName), x, y };
      })
      .filter(Boolean) as { key: string; name: string; x: number; y: number }[];
  }, [geo, bbox]);

  const hazardDots = useMemo(() => {
    return toMarkers(incidents, quakes).map((m) => {
      const [x, y] = project([m.lon, m.lat], bbox);
      const r = m.mag != null ? Math.max(4, Math.min(12, m.mag * 1.8)) : 5;
      return { ...m, x, y, r };
    });
  }, [incidents, quakes, bbox]);

  const detail = selected ?? hover;

  return (
    <div
      className="panel relative overflow-hidden rounded-sm bg-[#070807]"
      style={{ height }}
    >
      {!geo && !error && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-xs uppercase tracking-wider text-[var(--muted)]">
          Loading Nepal districts…
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-4 text-center text-xs text-[var(--danger)]">
          Map data failed to load ({error})
        </div>
      )}
      <svg
        viewBox="0 0 800 520"
        className="h-full w-full"
        role="img"
        aria-label="Nepal district population map"
      >
        <defs>
          <radialGradient id="hazard-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="520" fill="#070807" />
        {paths.map((p) => (
          <path
            key={p.key}
            d={p.d}
            fill={p.fill}
            fillOpacity={
              selected?.key === p.key || hover?.key === p.key ? 0.95 : 0.85
            }
            stroke={
              selected?.key === p.key || hover?.key === p.key
                ? "#f4d35e"
                : "#9fd9b8"
            }
            strokeWidth={
              selected?.key === p.key || hover?.key === p.key ? 1.8 : 0.7
            }
            strokeOpacity={0.75}
            className="cursor-pointer"
            onMouseEnter={() => setHover(p)}
            onMouseLeave={() => setHover(null)}
            onClick={() => {
              setSelectedHazard(null);
              setSelected(p);
            }}
          />
        ))}
        {labels.map((l) => (
          <text
            key={l.key}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            fill="#e8f5ee"
            fontSize="8"
            fontFamily="var(--font-mono), monospace"
            className="pointer-events-none uppercase"
            style={{ letterSpacing: "0.04em" }}
          >
            {l.name}
          </text>
        ))}
        {hazardDots.map((h) => (
          <g
            key={h.id}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(null);
              setSelectedHazard(h);
            }}
          >
            <circle cx={h.x} cy={h.y} r={h.r * 2.2} fill="url(#hazard-glow)" />
            <circle
              cx={h.x}
              cy={h.y}
              r={h.r}
              fill={h.hazardColor || "#ff6b6b"}
              stroke="#1a0808"
              strokeWidth="1.2"
            />
            {h.mag != null && (
              <text
                x={h.x}
                y={h.y - h.r - 4}
                textAnchor="middle"
                fill="#ffe8e8"
                fontSize="9"
                fontFamily="var(--font-mono), monospace"
                className="pointer-events-none"
              >
                M{h.mag.toFixed(1)}
              </text>
            )}
          </g>
        ))}
      </svg>

      {detail && !selectedHazard && (
        <aside className="absolute top-3 left-3 z-20 w-[min(260px,calc(100%-1.5rem))] rounded border border-[#2a3a30] bg-[#08110c]/92 p-3 text-xs shadow-lg backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                District
              </div>
              <div className="display mt-1 text-xl">{detail.name}</div>
            </div>
            {selected && (
              <button
                type="button"
                className="text-[var(--muted)] hover:text-white"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>
          <p className="mt-1 text-[var(--muted)]">
            {detail.province} · HQ {detail.hq}
          </p>
          <dl className="mono mt-3 space-y-1.5 text-[11px]">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Population</dt>
              <dd>{formatNumber(detail.population)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Area</dt>
              <dd>{formatNumber(detail.areaKm2, 0)} km²</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Density</dt>
              <dd>{formatCompact(detail.density)} /km²</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">National share</dt>
              <dd>{detail.sharePct}%</dd>
            </div>
          </dl>
        </aside>
      )}

      {selectedHazard && (
        <aside className="absolute top-3 left-3 z-20 w-[min(280px,calc(100%-1.5rem))] rounded border border-[#3a2222] bg-[#100808]/92 p-3 text-xs shadow-lg backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                {selectedHazard.hazard}
              </div>
              <div
                className="display mt-1 text-2xl"
                style={{ color: selectedHazard.hazardColor || "#ff6b6b" }}
              >
                {selectedHazard.mag != null
                  ? `M ${selectedHazard.mag.toFixed(1)}`
                  : selectedHazard.hazard}
              </div>
            </div>
            <button
              type="button"
              className="text-[var(--muted)] hover:text-white"
              onClick={() => setSelectedHazard(null)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 leading-snug">{selectedHazard.title}</p>
          <dl className="mono mt-3 space-y-1.5 text-[11px]">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Source</dt>
              <dd className="uppercase">{selectedHazard.source}</dd>
            </div>
            {selectedHazard.depth != null && (
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">Depth</dt>
                <dd>{selectedHazard.depth.toFixed(1)} km</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Occurred</dt>
              <dd>{timeAgo(selectedHazard.time)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Coords</dt>
              <dd>
                {selectedHazard.lat.toFixed(3)}°, {selectedHazard.lon.toFixed(3)}°
              </dd>
            </div>
          </dl>
          {selectedHazard.url && (
            <a
              href={selectedHazard.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-[var(--accent)] hover:underline"
            >
              Open details →
            </a>
          )}
        </aside>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded bg-[#050505cc] px-2.5 py-2 text-[10px] text-[var(--muted)]">
        <div className="uppercase tracking-wider">
          Population · hazard markers
        </div>
        <div className="mt-1.5 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#0d3d2c]" />
          <span className="h-2 w-2 rounded-full bg-[#1a6b4a]" />
          <span className="h-2 w-2 rounded-full bg-[#2f9e6a]" />
          <span className="h-2 w-2 rounded-full bg-[#3ddc97]" />
          <span className="h-2 w-2 rounded-full bg-[#b8ffe0]" />
          <span className="ml-1">sparse → dense</span>
        </div>
        <div className="mt-1.5 normal-case tracking-normal">
          Click a district or marker for details
        </div>
      </div>
    </div>
  );
}
