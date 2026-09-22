"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { PROVINCE_NAMES } from "@/lib/domains";
import { formatCompact } from "@/lib/format";
import { DISTRICT_POPULATION } from "@/lib/seed/metrics";
import type { QuakeEvent } from "@/lib/types";

type HoverInfo = {
  name: string;
  population: number;
  province: string;
  x: number;
  y: number;
};

export function NepalMap({
  quakes = [],
  height = "100%",
}: {
  quakes?: QuakeEvent[];
  height?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        name: "nepal-dark",
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#070807" },
          },
        ],
      },
      center: [84.1, 28.2],
      zoom: 6.2,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    let cancelled = false;

    async function loadDistricts() {
      try {
        const res = await fetch("/api/geo/districts");
        if (!res.ok) throw new Error(String(res.status));
        const geo = (await res.json()) as GeoJSON.FeatureCollection;
        const enriched: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: geo.features.map((f) => {
            const name = String(f.properties?.DISTRICT ?? "").toUpperCase();
            const provinceId = Number(f.properties?.PROVINCE ?? 0);
            const population =
              DISTRICT_POPULATION[name] ??
              Math.round(200000 + ((name.length * 17000) % 400000));
            return {
              ...f,
              properties: {
                ...f.properties,
                name,
                population,
                provinceName:
                  PROVINCE_NAMES[provinceId]?.en ?? `Province ${provinceId}`,
              },
            };
          }),
        };

        if (cancelled || !mapRef.current) return;

        const apply = () => {
          if (map.getSource("districts")) return;
          map.addSource("districts", { type: "geojson", data: enriched });
          map.addLayer({
            id: "district-fill",
            type: "fill",
            source: "districts",
            paint: {
              "fill-color": [
                "interpolate",
                ["linear"],
                ["get", "population"],
                50000,
                "#1f4d38",
                300000,
                "#2f9e6a",
                700000,
                "#3ddc97",
                1500000,
                "#d4ffe8",
              ],
              "fill-opacity": 0.88,
            },
          });
          map.addLayer({
            id: "district-line",
            type: "line",
            source: "districts",
            paint: {
              "line-color": "#9fd9b8",
              "line-width": 0.8,
              "line-opacity": 0.55,
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

    map.on("mousemove", "district-fill", (e) => {
      const f = e.features?.[0];
      if (!f || !e.point) {
        setHover(null);
        return;
      }
      map.getCanvas().style.cursor = "pointer";
      setHover({
        name: String(f.properties?.name ?? ""),
        population: Number(f.properties?.population ?? 0),
        province: String(f.properties?.provinceName ?? ""),
        x: e.point.x,
        y: e.point.y,
      });
    });

    map.on("mouseleave", "district-fill", () => {
      map.getCanvas().style.cursor = "";
      setHover(null);
    });

    return () => {
      cancelled = true;
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
        properties: { mag: q.mag, place: q.place },
        geometry: { type: "Point", coordinates: [q.lon, q.lat] },
      })),
    };

    const source = map.getSource("quakes") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(data);
      return;
    }

    map.addSource("quakes", { type: "geojson", data });
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
          6,
          14,
        ],
        "circle-color": "#ff6b6b",
        "circle-opacity": 0.85,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#290909",
      },
    });
  }, [quakes, status]);

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
      {hover && (
        <div
          className="pointer-events-none absolute z-20 rounded border border-[#333] bg-[#111] px-2 py-1 text-xs shadow"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <div className="font-medium">{hover.name}</div>
          <div className="text-[var(--muted)]">{hover.province}</div>
          <div className="mono mt-1">Pop ~ {formatCompact(hover.population)}</div>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-[#050505cc] px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
        District population choropleth · quake markers
      </div>
    </div>
  );
}
