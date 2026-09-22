"use client";

import { useEffect, useRef, useState } from "react";
import {
  GeoJSONSource,
  Map as MapLibreMap,
  MapLayerMouseEvent,
  NavigationControl,
  Popup,
  ScaleControl,
} from "maplibre-gl";
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

type DistrictHover = {
  name: string;
  population: number;
  province: string;
  hq: string;
  areaKm2: number;
  density: number;
  sharePct: number;
  x: number;
  y: number;
};

type DistrictSelection = {
  name: string;
  population: number;
  province: string;
  hq: string;
  areaKm2: number;
  density: number;
  sharePct: number;
};

type HazardSelection = DisasterIncident & {
  magType?: string;
  felt?: number | null;
  tsunami?: number;
  significance?: number;
  status?: string;
  place?: string;
};

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

function enrichFromQuake(
  marker: DisasterIncident,
  quakes: QuakeEvent[],
): HazardSelection {
  if (marker.source !== "usgs") return marker;
  const rawId = marker.id.startsWith("usgs-")
    ? marker.id.slice(5)
    : marker.id;
  const q = quakes.find((item) => item.id === rawId);
  if (!q) return marker;
  return {
    ...marker,
    mag: q.mag,
    depth: q.depth,
    url: q.url,
    title: q.title ?? marker.title,
    place: q.place,
    magType: q.magType,
    felt: q.felt,
    tsunami: q.tsunami,
    significance: q.significance,
    status: q.status,
  };
}

function hazardAccent(marker: HazardSelection): string {
  if (marker.mag != null) {
    if (marker.mag >= 6) return "#ff3b3b";
    if (marker.mag >= 5) return "#ff6b6b";
    if (marker.mag >= 4) return "#ff9f43";
    if (marker.mag >= 3) return "#f4d35e";
    return "#7bdff2";
  }
  return marker.hazardColor || "#ff6b6b";
}

function buildHazardPopupHtml(h: HazardSelection): string {
  const when = new Date(h.time).toLocaleString("en-NP", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const accent = hazardAccent(h);
  const headline =
    h.mag != null
      ? h.magType
        ? `M${h.mag.toFixed(1)} (${h.magType})`
        : `M ${h.mag.toFixed(1)}`
      : h.hazard;
  const felt =
    h.felt != null && h.felt > 0 ? `${formatNumber(h.felt)} reports` : null;
  const linkLabel =
    h.source === "usgs" ? "USGS event details →" : "BIPAD incident →";

  return `
    <div class="quake-popup">
      <div class="quake-popup__mag" style="color:${accent}">${headline}</div>
      <div class="quake-popup__place">${h.title}</div>
      <div class="quake-popup__meta">
        <div><span>Hazard</span> ${h.hazard}</div>
        ${
          h.depth != null
            ? `<div><span>Depth</span> ${h.depth.toFixed(1)} km</div>`
            : ""
        }
        <div><span>When</span> ${when}</div>
        <div><span>Ago</span> ${timeAgo(h.time)}</div>
        ${felt ? `<div><span>Felt</span> ${felt}</div>` : ""}
        <div><span>Coords</span> ${h.lat.toFixed(3)}°, ${h.lon.toFixed(3)}°</div>
        <div><span>Source</span> ${h.source.toUpperCase()}</div>
      </div>
      ${
        h.url
          ? `<a class="quake-popup__link" href="${h.url}" target="_blank" rel="noopener noreferrer">${linkLabel}</a>`
          : ""
      }
    </div>
  `;
}

export function NepalMap({
  quakes = [],
  incidents = [],
  height = "100%",
}: {
  quakes?: QuakeEvent[];
  incidents?: DisasterIncident[];
  height?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const quakesRef = useRef(quakes);
  const [hover, setHover] = useState<DistrictHover | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<HazardSelection | null>(
    null,
  );
  const [selectedDistrict, setSelectedDistrict] =
    useState<DistrictSelection | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  quakesRef.current = quakes;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/dark",
      center: [84.1, 28.2],
      zoom: 6.35,
      minZoom: 5,
      maxZoom: 12,
      maxBounds: [
        [78.5, 25.5],
        [90.0, 31.8],
      ],
    });

    map.addControl(new NavigationControl({ showCompass: true }), "top-right");
    map.addControl(
      new ScaleControl({ maxWidth: 120, unit: "metric" }),
      "bottom-right",
    );
    mapRef.current = map;

    const popup = new Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 14,
      maxWidth: "280px",
      className: "nepal-map-popup",
    });
    popupRef.current = popup;

    let cancelled = false;

    async function loadDistricts() {
      try {
        const res = await fetch("/api/geo/districts");
        if (!res.ok) throw new Error(String(res.status));
        const geo = (await res.json()) as GeoJSON.FeatureCollection;

        const hqFeatures: GeoJSON.Feature[] = [];
        const enriched: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: geo.features.map((f) => {
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
            const hq = titleCaseHq(String(f.properties?.HQ ?? ""));
            const name = displayDistrictName(rawName);
            const provinceName =
              PROVINCE_NAMES[provinceId]?.en ?? `Province ${provinceId}`;
            const provinceNp = PROVINCE_NAMES[provinceId]?.np ?? "";

            const center = featureCentroid(f.geometry);
            if (center) {
              hqFeatures.push({
                type: "Feature",
                properties: {
                  name,
                  hq: hq || name,
                  provinceName,
                  population,
                },
                geometry: { type: "Point", coordinates: center },
              });
            }

            return {
              ...f,
              properties: {
                ...f.properties,
                name,
                key,
                population,
                areaKm2,
                density,
                sharePct,
                hq: hq || "—",
                provinceId,
                provinceName,
                provinceNp,
              },
            };
          }),
        };

        if (cancelled || !mapRef.current) return;

        const apply = () => {
          if (map.getSource("districts")) return;

          map.addSource("districts", {
            type: "geojson",
            data: enriched,
            promoteId: "key",
          });
          map.addSource("district-centers", {
            type: "geojson",
            data: { type: "FeatureCollection", features: hqFeatures },
          });

          const underRoads = map.getLayer("highway_path")
            ? "highway_path"
            : map.getLayer("boundary_state")
              ? "boundary_state"
              : undefined;

          if (map.getSource("ne2_shaded") && !map.getLayer("nepal-relief")) {
            map.addLayer(
              {
                id: "nepal-relief",
                type: "raster",
                source: "ne2_shaded",
                maxzoom: 8,
                paint: {
                  "raster-opacity": 0.45,
                  "raster-contrast": 0.15,
                },
              },
              underRoads,
            );
          }

          map.addLayer(
            {
              id: "district-fill",
              type: "fill",
              source: "districts",
              paint: {
                "fill-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "population"],
                  50000,
                  "#0d3d2c",
                  200000,
                  "#1a6b4a",
                  500000,
                  "#2f9e6a",
                  900000,
                  "#3ddc97",
                  1500000,
                  "#b8ffe0",
                ],
                "fill-opacity": [
                  "case",
                  ["boolean", ["feature-state", "hover"], false],
                  0.55,
                  0.28,
                ],
              },
            },
            underRoads,
          );

          map.addLayer(
            {
              id: "district-line",
              type: "line",
              source: "districts",
              paint: {
                "line-color": "#9fd9b8",
                "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  5,
                  0.4,
                  8,
                  1.1,
                  11,
                  1.6,
                ],
                "line-opacity": 0.65,
              },
            },
            underRoads,
          );

          map.addLayer({
            id: "district-highlight",
            type: "line",
            source: "districts",
            filter: ["==", ["get", "key"], ""],
            paint: {
              "line-color": "#f4d35e",
              "line-width": 2.2,
              "line-opacity": 0.95,
            },
          });

          const underPlaces = map.getLayer("place_other")
            ? "place_other"
            : undefined;

          map.addLayer(
            {
              id: "district-labels",
              type: "symbol",
              source: "districts",
              minzoom: 6.2,
              layout: {
                "text-field": ["get", "name"],
                "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  6.2,
                  9,
                  9,
                  12,
                  11,
                  14,
                ],
                "text-font": ["Noto Sans Regular"],
                "text-transform": "uppercase",
                "text-letter-spacing": 0.04,
                "text-max-width": 8,
                "text-padding": 2,
                "symbol-sort-key": ["-", ["get", "population"]],
              },
              paint: {
                "text-color": "#e8f5ee",
                "text-halo-color": "#050805",
                "text-halo-width": 1.4,
                "text-opacity": 0.92,
              },
            },
            underPlaces,
          );

          map.addLayer({
            id: "hq-dots",
            type: "circle",
            source: "district-centers",
            minzoom: 7,
            paint: {
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                7,
                2,
                10,
                3.5,
              ],
              "circle-color": "#f2f2f0",
              "circle-opacity": 0.85,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#1a1a18",
            },
          });

          map.addLayer({
            id: "hq-labels",
            type: "symbol",
            source: "district-centers",
            minzoom: 8.2,
            layout: {
              "text-field": ["get", "hq"],
              "text-size": 10,
              "text-font": ["Noto Sans Regular"],
              "text-offset": [0, 1.1],
              "text-anchor": "top",
              "text-optional": true,
            },
            paint: {
              "text-color": "#c8c8c0",
              "text-halo-color": "#050805",
              "text-halo-width": 1.1,
            },
          });

          setStatus("ready");
        };

        if (map.isStyleLoaded()) apply();
        else map.once("load", apply);
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    map.on("load", () => {
      void loadDistricts();
    });

    let hoveredId: string | number | undefined;

    map.on("mousemove", "district-fill", (e) => {
      const f = e.features?.[0];
      if (!f || !e.point) {
        setHover(null);
        return;
      }
      map.getCanvas().style.cursor = "pointer";

      const nextId = (f.id ?? f.properties?.key) as string | number | undefined;
      if (hoveredId !== undefined && hoveredId !== nextId) {
        map.setFeatureState(
          { source: "districts", id: hoveredId },
          { hover: false },
        );
      }
      if (nextId !== undefined) {
        hoveredId = nextId;
        map.setFeatureState(
          { source: "districts", id: nextId },
          { hover: true },
        );
      }

      if (map.getLayer("district-highlight")) {
        map.setFilter("district-highlight", [
          "==",
          ["get", "key"],
          String(f.properties?.key ?? ""),
        ]);
      }

      setHover({
        name: String(f.properties?.name ?? ""),
        population: Number(f.properties?.population ?? 0),
        province: String(f.properties?.provinceName ?? ""),
        hq: String(f.properties?.hq ?? "—"),
        areaKm2: Number(f.properties?.areaKm2 ?? 0),
        density: Number(f.properties?.density ?? 0),
        sharePct: Number(f.properties?.sharePct ?? 0),
        x: e.point.x,
        y: e.point.y,
      });
    });

    map.on("mouseleave", "district-fill", () => {
      map.getCanvas().style.cursor = "";
      if (hoveredId !== undefined) {
        map.setFeatureState(
          { source: "districts", id: hoveredId },
          { hover: false },
        );
        hoveredId = undefined;
      }
      if (map.getLayer("district-highlight")) {
        map.setFilter("district-highlight", ["==", ["get", "key"], ""]);
      }
      setHover(null);
    });

    map.on("click", "district-fill", (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const hazardLayers = ["hazard-circles", "hazard-halo"].filter((id) =>
        map.getLayer(id),
      );
      if (hazardLayers.length) {
        const hazardHits = map.queryRenderedFeatures(e.point, {
          layers: hazardLayers,
        });
        if (hazardHits.length) return;
      }

      setSelectedHazard(null);
      popupRef.current?.remove();
      setSelectedDistrict({
        name: String(f.properties?.name ?? ""),
        population: Number(f.properties?.population ?? 0),
        province: String(f.properties?.provinceName ?? ""),
        hq: String(f.properties?.hq ?? "—"),
        areaKm2: Number(f.properties?.areaKm2 ?? 0),
        density: Number(f.properties?.density ?? 0),
        sharePct: Number(f.properties?.sharePct ?? 0),
      });
    });

    map.on("click", (e) => {
      const layers = ["hazard-circles", "hazard-halo", "district-fill"].filter(
        (id) => map.getLayer(id),
      );
      const hits = map.queryRenderedFeatures(e.point, { layers });
      if (!hits.length) {
        setSelectedDistrict(null);
        setSelectedHazard(null);
        popupRef.current?.remove();
      }
    });

    return () => {
      cancelled = true;
      popup.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    const markers = toMarkers(incidents, quakes);
    const data: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: markers.map((m) => ({
        type: "Feature",
        properties: {
          id: m.id,
          source: m.source,
          hazardId: m.hazardId,
          hazard: m.hazard,
          color: m.hazardColor || "#ff6b6b",
          title: m.title,
          time: m.time,
          url: m.url ?? "",
          mag: m.mag ?? -1,
          depth: m.depth ?? -1,
          lat: m.lat,
          lon: m.lon,
          radius: m.mag != null ? Math.max(5, Math.min(16, m.mag * 2.4)) : 6,
          label:
            m.mag != null ? `M${m.mag.toFixed(1)}` : String(m.hazard).slice(0, 10),
        },
        geometry: { type: "Point", coordinates: [m.lon, m.lat] },
      })),
    };

    const existing = map.getSource("hazards") as GeoJSONSource | undefined;
    if (existing) {
      existing.setData(data);
    } else {
      map.addSource("hazards", { type: "geojson", data });

      map.addLayer({
        id: "hazard-halo",
        type: "circle",
        source: "hazards",
        paint: {
          "circle-radius": ["+", ["get", "radius"], 8],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.16,
          "circle-stroke-width": 1,
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-opacity": 0.4,
        },
      });

      map.addLayer({
        id: "hazard-circles",
        type: "circle",
        source: "hazards",
        paint: {
          "circle-radius": ["get", "radius"],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.9,
          "circle-stroke-width": 1.4,
          "circle-stroke-color": "#120808",
        },
      });

      map.addLayer({
        id: "hazard-labels",
        type: "symbol",
        source: "hazards",
        minzoom: 6.8,
        layout: {
          "text-field": ["get", "label"],
          "text-size": 10,
          "text-font": ["Noto Sans Regular"],
          "text-offset": [0, -1.35],
          "text-anchor": "bottom",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#ffe8e8",
          "text-halo-color": "#1a0808",
          "text-halo-width": 1.2,
        },
      });
    }

    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    const onClick = (e: MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f || !f.geometry || f.geometry.type !== "Point") return;
      const props = f.properties ?? {};
      const base: DisasterIncident = {
        id: String(props.id ?? ""),
        source: (String(props.source ?? "bipad") as "bipad" | "usgs"),
        hazardId: Number(props.hazardId ?? 0),
        hazard: String(props.hazard ?? "Hazard"),
        hazardColor: String(props.color ?? "#ff6b6b"),
        title: String(props.title ?? ""),
        time: String(props.time ?? new Date().toISOString()),
        lat: Number(props.lat ?? f.geometry.coordinates[1]),
        lon: Number(props.lon ?? f.geometry.coordinates[0]),
        url: String(props.url || "") || undefined,
        mag: Number(props.mag) >= 0 ? Number(props.mag) : undefined,
        depth: Number(props.depth) >= 0 ? Number(props.depth) : undefined,
      };
      const selection = enrichFromQuake(base, quakesRef.current);
      setSelectedDistrict(null);
      setSelectedHazard(selection);
      popupRef.current
        ?.setLngLat(f.geometry.coordinates as [number, number])
        .setHTML(buildHazardPopupHtml(selection))
        .addTo(map);
    };

    map.on("mouseenter", "hazard-circles", onEnter);
    map.on("mouseleave", "hazard-circles", onLeave);
    map.on("click", "hazard-circles", onClick);
    map.on("click", "hazard-halo", onClick);

    return () => {
      map.off("mouseenter", "hazard-circles", onEnter);
      map.off("mouseleave", "hazard-circles", onLeave);
      map.off("click", "hazard-circles", onClick);
      map.off("click", "hazard-halo", onClick);
    };
  }, [incidents, quakes, status]);

  const detail = selectedHazard
    ? ("hazard" as const)
    : selectedDistrict
      ? ("district" as const)
      : null;

  const legend =
    incidents.length > 0
      ? "Population · multi-hazard markers"
      : "Population · earthquake markers";

  return (
    <div className="panel relative overflow-hidden rounded-sm" style={{ height }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {status !== "ready" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#070807]/70 text-xs uppercase tracking-wider text-[var(--muted)]">
          {status === "loading"
            ? "Loading Nepal districts…"
            : "Map data failed to load"}
        </div>
      )}

      {hover && !selectedHazard && (
        <div
          className="pointer-events-none absolute z-20 max-w-[220px] rounded border border-[#333] bg-[#0d0d0d]/95 px-2.5 py-2 text-xs shadow-lg backdrop-blur-sm"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <div className="font-medium tracking-wide">{hover.name}</div>
          <div className="text-[var(--muted)]">
            {hover.province} · HQ {hover.hq}
          </div>
          <div className="mono mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
            <span className="text-[var(--muted)]">Population</span>
            <span>{formatCompact(hover.population)}</span>
            <span className="text-[var(--muted)]">Area</span>
            <span>{formatNumber(hover.areaKm2, 0)} km²</span>
            <span className="text-[var(--muted)]">Density</span>
            <span>{formatNumber(hover.density)} /km²</span>
            <span className="text-[var(--muted)]">National</span>
            <span>{hover.sharePct}%</span>
          </div>
        </div>
      )}

      {detail === "hazard" && selectedHazard && (
        <aside className="map-detail-panel absolute top-3 left-3 z-20 w-[min(280px,calc(100%-1.5rem))] rounded border border-[#3a2222] bg-[#100808]/92 p-3 text-xs shadow-lg backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                {selectedHazard.hazard}
              </div>
              <div
                className="display mt-1 text-2xl"
                style={{ color: hazardAccent(selectedHazard) }}
              >
                {selectedHazard.mag != null ? (
                  <>
                    M {selectedHazard.mag.toFixed(1)}
                    {selectedHazard.magType ? (
                      <span className="ml-2 text-sm text-[var(--muted)]">
                        {selectedHazard.magType}
                      </span>
                    ) : null}
                  </>
                ) : (
                  selectedHazard.hazard
                )}
              </div>
            </div>
            <button
              type="button"
              className="text-[var(--muted)] hover:text-white"
              onClick={() => {
                setSelectedHazard(null);
                popupRef.current?.remove();
              }}
              aria-label="Close hazard details"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 leading-snug text-[var(--text)]">
            {selectedHazard.title}
          </p>
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
            {selectedHazard.source === "usgs" && (
              <>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">Felt reports</dt>
                  <dd>
                    {selectedHazard.felt != null && selectedHazard.felt > 0
                      ? formatNumber(selectedHazard.felt)
                      : "none yet"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">Significance</dt>
                  <dd>{selectedHazard.significance ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">Tsunami alert</dt>
                  <dd>{selectedHazard.tsunami ? "Yes" : "No"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">Review status</dt>
                  <dd className="capitalize">
                    {selectedHazard.status || "—"}
                  </dd>
                </div>
              </>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Latitude</dt>
              <dd>{selectedHazard.lat.toFixed(3)}°</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Longitude</dt>
              <dd>{selectedHazard.lon.toFixed(3)}°</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Local time</dt>
              <dd className="text-right">
                {new Date(selectedHazard.time).toLocaleString("en-NP", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
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
              {selectedHazard.source === "usgs"
                ? "Open USGS report →"
                : "Open BIPAD incident →"}
            </a>
          )}
        </aside>
      )}

      {detail === "district" && selectedDistrict && (
        <aside className="map-detail-panel absolute top-3 left-3 z-20 w-[min(280px,calc(100%-1.5rem))] rounded border border-[#2a3a30] bg-[#08110c]/92 p-3 text-xs shadow-lg backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                District
              </div>
              <div className="display mt-1 text-xl">{selectedDistrict.name}</div>
            </div>
            <button
              type="button"
              className="text-[var(--muted)] hover:text-white"
              onClick={() => setSelectedDistrict(null)}
              aria-label="Close district details"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-[var(--muted)]">
            {selectedDistrict.province} · Headquarters {selectedDistrict.hq}
          </p>
          <dl className="mono mt-3 space-y-1.5 text-[11px]">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Population (2021)</dt>
              <dd>{formatNumber(selectedDistrict.population)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Land area</dt>
              <dd>{formatNumber(selectedDistrict.areaKm2, 0)} km²</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Density</dt>
              <dd>{formatNumber(selectedDistrict.density)} /km²</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Share of Nepal</dt>
              <dd>{selectedDistrict.sharePct}%</dd>
            </div>
          </dl>
        </aside>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[240px] rounded bg-[#050505cc] px-2.5 py-2 text-[10px] text-[var(--muted)]">
        <div className="uppercase tracking-wider">{legend}</div>
        <div className="mt-1.5 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#0d3d2c]" />
          <span className="h-2 w-2 rounded-full bg-[#1a6b4a]" />
          <span className="h-2 w-2 rounded-full bg-[#2f9e6a]" />
          <span className="h-2 w-2 rounded-full bg-[#3ddc97]" />
          <span className="h-2 w-2 rounded-full bg-[#b8ffe0]" />
          <span className="ml-1">sparse → dense</span>
        </div>
        <div className="mt-1.5 normal-case tracking-normal">
          Click a district or hazard marker for full details
        </div>
      </div>
    </div>
  );
}
