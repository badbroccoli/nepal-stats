"use client";

import { useEffect, useMemo, useState } from "react";
import Map, { Layer, NavigationControl, Popup, Source } from "react-map-gl/maplibre";
import type { MapLayerMouseEvent } from "maplibre-gl";
import { PROVINCE_NAMES } from "@/lib/domains";
import { formatCompact } from "@/lib/format";
import { DISTRICT_POPULATION } from "@/lib/seed/metrics";
import type { QuakeEvent } from "@/lib/types";

type HoverInfo = {
  lng: number;
  lat: number;
  name: string;
  population: number;
  province: string;
};

export function NepalMap({
  quakes = [],
  height = "100%",
}: {
  quakes?: QuakeEvent[];
  height?: string;
}) {
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  useEffect(() => {
    fetch("/api/geo/districts")
      .then((r) => r.json())
      .then((data) => setGeo(data))
      .catch(() => setGeo(null));
  }, []);

  const enriched = useMemo(() => {
    if (!geo) return null;
    return {
      type: "FeatureCollection" as const,
      features: geo.features.map((f) => {
        const name = String(f.properties?.DISTRICT ?? "").toUpperCase();
        const provinceId = Number(f.properties?.PROVINCE ?? 0);
        const population =
          DISTRICT_POPULATION[name] ??
          Math.round(200000 + (name.length * 17000) % 400000);
        return {
          ...f,
          properties: {
            ...f.properties,
            name,
            population,
            provinceName: PROVINCE_NAMES[provinceId]?.en ?? `Province ${provinceId}`,
          },
        };
      }),
    };
  }, [geo]);

  const onMove = (e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f || !e.lngLat) {
      setHover(null);
      return;
    }
    setHover({
      lng: e.lngLat.lng,
      lat: e.lngLat.lat,
      name: String(f.properties?.name ?? ""),
      population: Number(f.properties?.population ?? 0),
      province: String(f.properties?.provinceName ?? ""),
    });
  };

  return (
    <div className="panel relative overflow-hidden rounded-sm" style={{ height }}>
      <Map
        initialViewState={{
          longitude: 84.1,
          latitude: 28.2,
          zoom: 6.2,
        }}
        mapStyle={{
          version: 8,
          name: "nepal-dark",
          glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
          sources: {},
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#070807" },
            },
          ],
        }}
        style={{ width: "100%", height: "100%" }}
        interactiveLayerIds={enriched ? ["district-fill"] : []}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        cursor={hover ? "pointer" : "grab"}
      >
        <NavigationControl position="top-right" showCompass={false} />
        {enriched && (
          <Source id="districts" type="geojson" data={enriched}>
            <Layer
              id="district-fill"
              type="fill"
              paint={{
                "fill-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "population"],
                  50000,
                  "#1a2e24",
                  300000,
                  "#2f6b4f",
                  700000,
                  "#3ddc97",
                  1500000,
                  "#b8f5d4",
                ],
                "fill-opacity": 0.72,
              }}
            />
            <Layer
              id="district-line"
              type="line"
              paint={{
                "line-color": "#0a0a0a",
                "line-width": 0.6,
              }}
            />
          </Source>
        )}

        {quakes.length > 0 && (
          <Source
            id="quakes"
            type="geojson"
            data={{
              type: "FeatureCollection",
              features: quakes.map((q) => ({
                type: "Feature",
                properties: { mag: q.mag, place: q.place },
                geometry: {
                  type: "Point",
                  coordinates: [q.lon, q.lat],
                },
              })),
            }}
          >
            <Layer
              id="quake-circles"
              type="circle"
              paint={{
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
              }}
            />
          </Source>
        )}

        {hover && (
          <Popup
            longitude={hover.lng}
            latitude={hover.lat}
            closeButton={false}
            offset={12}
          >
            <div className="text-xs">
              <div className="font-medium">{hover.name}</div>
              <div className="text-[var(--muted)]">{hover.province}</div>
              <div className="mono mt-1">
                Pop ~ {formatCompact(hover.population)}
              </div>
            </div>
          </Popup>
        )}
      </Map>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-[#050505cc] px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
        District population choropleth · quake markers
      </div>
    </div>
  );
}
