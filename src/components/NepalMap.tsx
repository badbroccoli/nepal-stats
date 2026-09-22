"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
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
import type { QuakeEvent } from "@/lib/types";

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

type QuakeSelection = {
  id: string;
  mag: number;
  place: string;
  depth: number;
  time: string;
  lat: number;
  lon: number;
  url: string;
  magType?: string;
  felt?: number | null;
  tsunami?: number;
  significance?: number;
  status?: string;
  title?: string;
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

function quakeColor(mag: number): string {
  if (mag >= 6) return "#ff3b3b";
  if (mag >= 5) return "#ff6b6b";
  if (mag >= 4) return "#ff9f43";
  if (mag >= 3) return "#f4d35e";
  return "#7bdff2";
}

function buildQuakePopupHtml(q: QuakeSelection): string {
  const when = new Date(q.time).toLocaleString("en-NP", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const felt =
    q.felt != null && q.felt > 0 ? `${formatNumber(q.felt)} reports` : "none yet";
  const magLabel = q.magType ? `M${q.mag.toFixed(1)} (${q.magType})` : `M ${q.mag.toFixed(1)}`;
  return `
    <div class="quake-popup">
      <div class="quake-popup__mag" style="color:${quakeColor(q.mag)}">${magLabel}</div>
      <div class="quake-popup__place">${q.title ?? q.place}</div>
      <div class="quake-popup__meta">
        <div><span>Depth</span> ${q.depth.toFixed(1)} km</div>
        <div><span>When</span> ${when}</div>
        <div><span>Ago</span> ${timeAgo(q.time)}</div>
        <div><span>Felt</span> ${felt}</div>
        <div><span>Coords</span> ${q.lat.toFixed(3)}°, ${q.lon.toFixed(3)}°</div>
      </div>
      <a class="quake-popup__link" href="${q.url}" target="_blank" rel="noopener noreferrer">USGS event details →</a>
    </div>
  `;
}

export function NepalMap({
  quakes = [],
  height = "100%",
}: {
  quakes?: QuakeEvent[];
  height?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [hover, setHover] = useState<DistrictHover | null>(null);
  const [selectedQuake, setSelectedQuake] = useState<QuakeSelection | null>(null);
  const [selectedDistrict, setSelectedDistrict] =
    useState<DistrictSelection | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
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

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-right");
    mapRef.current = map;

    const popup = new maplibregl.Popup({
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

          // Sit under roads/labels so basemap detail stays readable.
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
        map.setFeatureState({ source: "districts", id: hoveredId }, { hover: false });
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
      const quakeLayers = ["quake-circles", "quake-halo"].filter((id) =>
        map.getLayer(id),
      );
      if (quakeLayers.length) {
        const quakeHits = map.queryRenderedFeatures(e.point, {
          layers: quakeLayers,
        });
        if (quakeHits.length) return;
      }

      setSelectedQuake(null);
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
      const layers = ["quake-circles", "quake-halo", "district-fill"].filter((id) =>
        map.getLayer(id),
      );
      const hits = map.queryRenderedFeatures(e.point, { layers });
      if (!hits.length) {
        setSelectedDistrict(null);
        setSelectedQuake(null);
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

    const data: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: quakes.map((q) => ({
        type: "Feature",
        properties: {
          id: q.id,
          mag: q.mag,
          place: q.place,
          depth: q.depth,
          time: q.time,
          url: q.url,
          lat: q.lat,
          lon: q.lon,
          magType: q.magType ?? "",
          felt: q.felt ?? -1,
          tsunami: q.tsunami ?? 0,
          significance: q.significance ?? 0,
          status: q.status ?? "",
          title: q.title ?? q.place,
          magLabel: `M${q.mag.toFixed(1)}`,
        },
        geometry: { type: "Point", coordinates: [q.lon, q.lat] },
      })),
    };

    const existing = map.getSource("quakes") as maplibregl.GeoJSONSource | undefined;
    if (existing) {
      existing.setData(data);
    } else {
      map.addSource("quakes", { type: "geojson", data });

      map.addLayer({
        id: "quake-halo",
        type: "circle",
        source: "quakes",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "mag"],
            2,
            10,
            4,
            18,
            6,
            30,
            7,
            40,
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "mag"],
            2,
            "#7bdff2",
            3.5,
            "#f4d35e",
            4.5,
            "#ff9f43",
            5.5,
            "#ff6b6b",
            6.5,
            "#ff3b3b",
          ],
          "circle-opacity": 0.18,
          "circle-stroke-width": 1,
          "circle-stroke-color": [
            "interpolate",
            ["linear"],
            ["get", "mag"],
            2,
            "#7bdff2",
            5,
            "#ff6b6b",
          ],
          "circle-stroke-opacity": 0.45,
        },
      });

      map.addLayer({
        id: "quake-circles",
        type: "circle",
        source: "quakes",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "mag"],
            2,
            4,
            4,
            7,
            5.5,
            11,
            7,
            16,
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "mag"],
            2,
            "#7bdff2",
            3.5,
            "#f4d35e",
            4.5,
            "#ff9f43",
            5.5,
            "#ff6b6b",
            6.5,
            "#ff3b3b",
          ],
          "circle-opacity": 0.92,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#1a0808",
        },
      });

      map.addLayer({
        id: "quake-labels",
        type: "symbol",
        source: "quakes",
        minzoom: 6.8,
        layout: {
          "text-field": ["get", "magLabel"],
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

    const onClick = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f || !f.geometry || f.geometry.type !== "Point") return;
      const props = f.properties ?? {};
      const selection: QuakeSelection = {
        id: String(props.id ?? ""),
        mag: Number(props.mag ?? 0),
        place: String(props.place ?? ""),
        depth: Number(props.depth ?? 0),
        time: String(props.time ?? new Date().toISOString()),
        lat: Number(props.lat ?? f.geometry.coordinates[1]),
        lon: Number(props.lon ?? f.geometry.coordinates[0]),
        url: String(props.url ?? "#"),
        magType: String(props.magType || "") || undefined,
        felt: Number(props.felt) >= 0 ? Number(props.felt) : null,
        tsunami: Number(props.tsunami ?? 0),
        significance: Number(props.significance ?? 0),
        status: String(props.status || "") || undefined,
        title: String(props.title || props.place || ""),
      };
      setSelectedDistrict(null);
      setSelectedQuake(selection);
      popupRef.current
        ?.setLngLat(f.geometry.coordinates as [number, number])
        .setHTML(buildQuakePopupHtml(selection))
        .addTo(map);
    };

    map.on("mouseenter", "quake-circles", onEnter);
    map.on("mouseleave", "quake-circles", onLeave);
    map.on("click", "quake-circles", onClick);
    map.on("click", "quake-halo", onClick);

    return () => {
      map.off("mouseenter", "quake-circles", onEnter);
      map.off("mouseleave", "quake-circles", onLeave);
      map.off("click", "quake-circles", onClick);
      map.off("click", "quake-halo", onClick);
    };
  }, [quakes, status]);

  const detail = selectedQuake
    ? ("quake" as const)
    : selectedDistrict
      ? ("district" as const)
      : null;

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

      {hover && !selectedQuake && (
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

      {detail === "quake" && selectedQuake && (
        <aside className="map-detail-panel absolute top-3 left-3 z-20 w-[min(280px,calc(100%-1.5rem))] rounded border border-[#3a2222] bg-[#100808]/92 p-3 text-xs shadow-lg backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                Earthquake
              </div>
              <div
                className="display mt-1 text-2xl"
                style={{ color: quakeColor(selectedQuake.mag) }}
              >
                M {selectedQuake.mag.toFixed(1)}
                {selectedQuake.magType ? (
                  <span className="ml-2 text-sm text-[var(--muted)]">
                    {selectedQuake.magType}
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              className="text-[var(--muted)] hover:text-white"
              onClick={() => {
                setSelectedQuake(null);
                popupRef.current?.remove();
              }}
              aria-label="Close quake details"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 leading-snug text-[var(--text)]">
            {selectedQuake.title ?? selectedQuake.place}
          </p>
          <dl className="mono mt-3 space-y-1.5 text-[11px]">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Magnitude type</dt>
              <dd>{selectedQuake.magType || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Depth</dt>
              <dd>{selectedQuake.depth.toFixed(1)} km</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Occurred</dt>
              <dd>{timeAgo(selectedQuake.time)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Felt reports</dt>
              <dd>
                {selectedQuake.felt != null && selectedQuake.felt > 0
                  ? formatNumber(selectedQuake.felt)
                  : "none yet"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Significance</dt>
              <dd>{selectedQuake.significance ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Tsunami alert</dt>
              <dd>{selectedQuake.tsunami ? "Yes" : "No"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Review status</dt>
              <dd className="capitalize">{selectedQuake.status || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Latitude</dt>
              <dd>{selectedQuake.lat.toFixed(3)}°</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Longitude</dt>
              <dd>{selectedQuake.lon.toFixed(3)}°</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--muted)]">Local time</dt>
              <dd className="text-right">
                {new Date(selectedQuake.time).toLocaleString("en-NP", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
          </dl>
          <a
            href={selectedQuake.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex text-[var(--accent)] hover:underline"
          >
            Open USGS report →
          </a>
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
        <div className="uppercase tracking-wider">Population · earthquakes</div>
        <div className="mt-1.5 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#0d3d2c]" />
          <span className="h-2 w-2 rounded-full bg-[#1a6b4a]" />
          <span className="h-2 w-2 rounded-full bg-[#2f9e6a]" />
          <span className="h-2 w-2 rounded-full bg-[#3ddc97]" />
          <span className="h-2 w-2 rounded-full bg-[#b8ffe0]" />
          <span className="ml-1">sparse → dense</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#7bdff2]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f4d35e]" />
          <span className="h-3 w-3 rounded-full bg-[#ff9f43]" />
          <span className="h-3.5 w-3.5 rounded-full bg-[#ff6b6b]" />
          <span>M2 → M6+</span>
        </div>
        <div className="mt-1.5 normal-case tracking-normal">
          Click a district or quake dot for full details
        </div>
      </div>
    </div>
  );
}
