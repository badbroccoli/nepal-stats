"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
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
import districtsGeo from "@/data/nepal-districts.json";

const VIEW_W = 800;
const VIEW_H = 520;
const MIN_ZOOM = 1;
const MAX_ZOOM = 10;
const ZOOM_STEP = 1.4;

type ViewTransform = { scale: number; tx: number; ty: number };

type DistrictPath = {
  key: string;
  name: string;
  d: string;
  cx: number;
  cy: number;
  population: number;
  province: string;
  hq: string;
  areaKm2: number;
  density: number;
  sharePct: number;
  fill: string;
};

type HazardDot = DisasterIncident & { x: number; y: number; r: number };

function clampZoom(scale: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
}

function zoomAt(
  prev: ViewTransform,
  factor: number,
  cx: number,
  cy: number,
): ViewTransform {
  const nextScale = clampZoom(prev.scale * factor);
  const ratio = nextScale / prev.scale;
  return {
    scale: nextScale,
    tx: cx - (cx - prev.tx) * ratio,
    ty: cy - (cy - prev.ty) * ratio,
  };
}

function clientToSvg(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): [number, number] {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return [VIEW_W / 2, VIEW_H / 2];
  const local = pt.matrixTransform(ctm.inverse());
  return [local.x, local.y];
}

function project([lon, lat]: Position, bbox: number[]): [number, number] {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const pad = 12;
  const w = VIEW_W - pad * 2;
  const h = VIEW_H - pad * 2;
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

/** Progressive detail ladder, similar to MapLibre minzoom layers. */
function detailLevel(scale: number) {
  return {
    showMajorLabels: true,
    showMediumLabels: scale >= 1.7,
    showAllLabels: scale >= 2.6,
    showHqDots: scale >= 3.2,
    showHqLabels: scale >= 4.2,
    showPopChips: scale >= 5.2,
    showHazardCaptions: scale >= 2.0,
    showHazardDepth: scale >= 4.0,
  };
}

function labelFontSize(scale: number, base: number) {
  // Keep text readable on screen while the map zooms in.
  return Math.max(6, Math.min(14, base / Math.sqrt(scale)));
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
  const geo = districtsGeo as FeatureCollection;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
  } | null>(null);
  const didDragRef = useRef(false);

  const [view, setView] = useState<ViewTransform>({ scale: 1, tx: 0, ty: 0 });
  const [selected, setSelected] = useState<DistrictPath | null>(null);
  const [hover, setHover] = useState<DistrictPath | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<HazardDot | null>(null);
  const [panning, setPanning] = useState(false);

  const bbox = useMemo(() => collectBBox(geo.features), [geo]);
  const levels = detailLevel(view.scale);
  const inv = 1 / view.scale;

  const paths = useMemo(() => {
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
      const c = featureCentroid(f.geometry);
      const [cx, cy] = c ? project(c, bbox) : [VIEW_W / 2, VIEW_H / 2];
      return {
        key,
        name,
        d: geometryToPath(f.geometry, bbox),
        cx,
        cy,
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

  const visibleLabels = useMemo(() => {
    return paths
      .filter((p) => {
        if (levels.showAllLabels) return true;
        if (levels.showMediumLabels) return p.population >= 120_000;
        return p.population >= 250_000;
      })
      .sort((a, b) => b.population - a.population);
  }, [paths, levels.showAllLabels, levels.showMediumLabels]);

  const hazardDots = useMemo(() => {
    return toMarkers(incidents, quakes).map((m) => {
      const [x, y] = project([m.lon, m.lat], bbox);
      const r = m.mag != null ? Math.max(4, Math.min(12, m.mag * 1.8)) : 5;
      return { ...m, x, y, r };
    });
  }, [incidents, quakes, bbox]);

  const applyZoom = useCallback((factor: number, cx: number, cy: number) => {
    setView((prev) => zoomAt(prev, factor, cx, cy));
  }, []);

  // Non-passive wheel listener so we can prevent page scroll while zooming.
  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const [cx, cy] = clientToSvg(svg, e.clientX, e.clientY);
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      applyZoom(factor, cx, cy);
    },
    [applyZoom],
  );

  // Attach after mount — React's onWheel is passive and cannot preventDefault.
  const svgCallbackRef = useCallback(
    (node: SVGSVGElement | null) => {
      if (svgRef.current) {
        svgRef.current.removeEventListener("wheel", onWheel as EventListener);
      }
      svgRef.current = node;
      if (node) {
        node.addEventListener("wheel", onWheel as EventListener, {
          passive: false,
        });
      }
    },
    [onWheel],
  );

  const onPointerDown = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    didDragRef.current = false;
    dragRef.current = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
    };
    setPanning(true);
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const sx = VIEW_W / rect.width;
    const sy = VIEW_H / rect.height;
    const dx = (e.clientX - drag.x) * sx;
    const dy = (e.clientY - drag.y) * sy;
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) {
      didDragRef.current = true;
    }
    drag.x = e.clientX;
    drag.y = e.clientY;
    setView((prev) => ({
      ...prev,
      tx: prev.tx + dx,
      ty: prev.ty + dy,
    }));
  }, []);

  const endPan = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (drag && drag.pointerId === e.pointerId) {
      dragRef.current = null;
    }
    setPanning(false);
  }, []);

  const zoomButton = useCallback(
    (factor: number) => {
      applyZoom(factor, VIEW_W / 2, VIEW_H / 2);
    },
    [applyZoom],
  );

  const resetView = useCallback(() => {
    setView({ scale: 1, tx: 0, ty: 0 });
  }, []);

  const detail = selected ?? hover;
  const strokeBase = levels.showAllLabels ? 0.9 : 0.7;
  const strokeHi = 1.8;

  return (
    <div
      className="panel relative overflow-hidden rounded-sm bg-[#070807]"
      style={{ height }}
    >
      <svg
        ref={svgCallbackRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={`h-full w-full touch-none ${panning ? "cursor-grabbing" : "cursor-grab"}`}
        role="img"
        aria-label="Nepal district population map"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <defs>
          <radialGradient id="hazard-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={VIEW_W} height={VIEW_H} fill="#070807" />
        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
          {paths.map((p) => {
            const active =
              selected?.key === p.key || hover?.key === p.key;
            return (
              <path
                key={p.key}
                d={p.d}
                fill={p.fill}
                fillOpacity={active ? 0.95 : 0.82}
                stroke={active ? "#f4d35e" : "#9fd9b8"}
                strokeWidth={(active ? strokeHi : strokeBase) * inv}
                strokeOpacity={0.75}
                className="cursor-pointer"
                onPointerEnter={() => setHover(p)}
                onPointerLeave={() => setHover(null)}
                onClick={() => {
                  if (didDragRef.current) return;
                  setSelectedHazard(null);
                  setSelected(p);
                }}
              />
            );
          })}

          {visibleLabels.map((l) => (
            <text
              key={`d-${l.key}`}
              x={l.cx}
              y={l.cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#e8f5ee"
              fontSize={labelFontSize(view.scale, levels.showAllLabels ? 9 : 8)}
              fontFamily="var(--font-mono), monospace"
              className="pointer-events-none uppercase"
              style={{ letterSpacing: "0.04em" }}
              stroke="#050805"
              strokeWidth={2.2 * inv}
              paintOrder="stroke"
            >
              {l.name}
            </text>
          ))}

          {levels.showHqDots &&
            paths.map((p) => (
              <g key={`hq-${p.key}`} className="pointer-events-none">
                <circle
                  cx={p.cx}
                  cy={p.cy + 0.5}
                  r={2.4 * inv}
                  fill="#f2f2f0"
                  stroke="#1a1a18"
                  strokeWidth={1 * inv}
                  opacity={0.9}
                />
                {levels.showHqLabels && p.hq !== "—" && (
                  <text
                    x={p.cx}
                    y={p.cy + 10 * inv}
                    textAnchor="middle"
                    fill="#c8c8c0"
                    fontSize={labelFontSize(view.scale, 8)}
                    fontFamily="var(--font-mono), monospace"
                    stroke="#050805"
                    strokeWidth={1.6 * inv}
                    paintOrder="stroke"
                  >
                    {p.hq}
                  </text>
                )}
                {levels.showPopChips && (
                  <text
                    x={p.cx}
                    y={p.cy - 9 * inv}
                    textAnchor="middle"
                    fill="#9fd9b8"
                    fontSize={labelFontSize(view.scale, 7)}
                    fontFamily="var(--font-mono), monospace"
                    stroke="#050805"
                    strokeWidth={1.4 * inv}
                    paintOrder="stroke"
                  >
                    {formatCompact(p.population)} · {formatCompact(p.density)}
                    /km²
                  </text>
                )}
              </g>
            ))}

          {hazardDots.map((h) => (
            <g
              key={h.id}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (didDragRef.current) return;
                setSelected(null);
                setSelectedHazard(h);
              }}
            >
              <circle
                cx={h.x}
                cy={h.y}
                r={h.r * 2.2 * inv}
                fill="url(#hazard-glow)"
              />
              <circle
                cx={h.x}
                cy={h.y}
                r={Math.max(3, h.r) * inv}
                fill={h.hazardColor || "#ff6b6b"}
                stroke="#1a0808"
                strokeWidth={1.2 * inv}
              />
              {levels.showHazardCaptions && (
                <text
                  x={h.x}
                  y={h.y - (h.r + 5) * inv}
                  textAnchor="middle"
                  fill="#ffe8e8"
                  fontSize={labelFontSize(view.scale, 8)}
                  fontFamily="var(--font-mono), monospace"
                  className="pointer-events-none"
                  stroke="#1a0808"
                  strokeWidth={1.6 * inv}
                  paintOrder="stroke"
                >
                  {h.mag != null
                    ? `M${h.mag.toFixed(1)}`
                    : h.hazard.slice(0, 10)}
                </text>
              )}
              {levels.showHazardDepth && h.depth != null && (
                <text
                  x={h.x}
                  y={h.y + (h.r + 10) * inv}
                  textAnchor="middle"
                  fill="#c8a0a0"
                  fontSize={labelFontSize(view.scale, 7)}
                  fontFamily="var(--font-mono), monospace"
                  className="pointer-events-none"
                >
                  {h.depth.toFixed(0)} km
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>

      <div className="absolute top-3 right-3 z-20 flex flex-col overflow-hidden rounded border border-[#2a3a30] bg-[#08110c]/92 text-sm shadow-lg backdrop-blur-sm">
        <button
          type="button"
          className="px-3 py-1.5 text-white hover:bg-[#122018]"
          onClick={() => zoomButton(ZOOM_STEP)}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className="border-t border-[#2a3a30] px-3 py-1.5 text-white hover:bg-[#122018]"
          onClick={() => zoomButton(1 / ZOOM_STEP)}
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          className="border-t border-[#2a3a30] px-3 py-1.5 text-[10px] uppercase tracking-wider text-[var(--muted)] hover:bg-[#122018] hover:text-white"
          onClick={resetView}
          aria-label="Reset map view"
        >
          Reset
        </button>
      </div>

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
                {selectedHazard.lat.toFixed(3)}°,{" "}
                {selectedHazard.lon.toFixed(3)}°
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
          Population · zoom for detail
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
          Scroll / pinch to zoom · drag to pan · HQ &amp; labels appear as you
          zoom in
        </div>
      </div>
    </div>
  );
}
