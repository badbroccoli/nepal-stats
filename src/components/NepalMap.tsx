"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { MapGeoJSONFeature, MapLayerMouseEvent } from "maplibre-gl";
import type { DisasterEvent } from "@/lib/types";

interface Props {
  earthquakes: DisasterEvent[];
  selectedDistrict: string | null;
  onSelectDistrict: (district: string | null) => void;
}

const NEPAL_BOUNDS: [[number, number], [number, number]] = [
  [79.5, 26.0],
  [88.5, 30.6],
];

// MapLibre v6 loads its geometry worker from a separate module file. Under
// Next.js the default URL resolves to a non-existent /_next chunk, so we point
// it at the copies served from /public/maplibre (see scripts/copy-maplibre-worker.mjs).
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export function NepalMap({ earthquakes, selectedDistrict, onSelectDistrict }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const hoveredId = useRef<number | string | null>(null);
  const selectedId = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: "bg", type: "background", paint: { "background-color": "#050505" } }],
      },
      bounds: NEPAL_BOUNDS,
      fitBoundsOptions: { padding: 24 },
      attributionControl: false,
    });
    mapRef.current = map;
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "Boundaries © geoJSON-Nepal · Quakes © USGS",
      }),
    );

    map.on("load", async () => {
      try {
        const res = await fetch("/api/v1/geo/districts", { cache: "force-cache" });
        const geojson = await res.json();
        map.addSource("districts", { type: "geojson", data: geojson, promoteId: "district" });

        map.addLayer({
          id: "district-fill",
          type: "fill",
          source: "districts",
          paint: {
            "fill-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              "#3ddc97",
              ["boolean", ["feature-state", "hover"], false],
              "#1f7a5a",
              "#1a2430",
            ],
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              0.6,
              0.9,
            ],
          },
        });
        map.addLayer({
          id: "district-line",
          type: "line",
          source: "districts",
          paint: { "line-color": "#3a4657", "line-width": 0.8 },
        });
        let districtPopup: maplibregl.Popup | null = null;

        map.on("mousemove", "district-fill", (e: MapLayerMouseEvent) => {
          if (!e.features?.length) return;
          const f = e.features[0] as MapGeoJSONFeature;
          if (hoveredId.current !== null) {
            map.setFeatureState({ source: "districts", id: hoveredId.current }, { hover: false });
          }
          hoveredId.current = f.id ?? null;
          if (hoveredId.current !== null) {
            map.setFeatureState({ source: "districts", id: hoveredId.current }, { hover: true });
          }
          map.getCanvas().style.cursor = "pointer";
          const name = f.properties?.district as string | undefined;
          if (name) {
            if (!districtPopup) {
              districtPopup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                className: "district-hover",
              });
            }
            districtPopup.setLngLat(e.lngLat).setText(name).addTo(map);
          }
        });
        map.on("mouseleave", "district-fill", () => {
          if (hoveredId.current !== null) {
            map.setFeatureState({ source: "districts", id: hoveredId.current }, { hover: false });
          }
          hoveredId.current = null;
          map.getCanvas().style.cursor = "";
          districtPopup?.remove();
        });
        map.on("click", "district-fill", (e: MapLayerMouseEvent) => {
          const f = e.features?.[0];
          const name = f?.properties?.district as string | undefined;
          onSelectDistrict(name ?? null);
        });

        readyRef.current = true;
        updateQuakes();
        // The map can initialise before the flex/grid layout settles its final
        // size; nudge it so the WebGL canvas matches the container and repaints.
        map.resize();
        map.fitBounds(NEPAL_BOUNDS, { padding: 24, duration: 0 });
      } catch {
        // Map still renders the dark background even if geo load fails.
      }
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateQuakes = () => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const fc = {
      type: "FeatureCollection" as const,
      features: earthquakes.map((q) => ({
        type: "Feature" as const,
        properties: { mag: q.magnitude, place: q.place },
        geometry: { type: "Point" as const, coordinates: [q.lon, q.lat] },
      })),
    };
    const existing = map.getSource("quakes") as maplibregl.GeoJSONSource | undefined;
    if (existing) {
      existing.setData(fc);
      return;
    }
    map.addSource("quakes", { type: "geojson", data: fc });
    map.addLayer({
      id: "quake-circles",
      type: "circle",
      source: "quakes",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["get", "mag"], 2, 3, 5, 10, 7, 20],
        "circle-color": "#ff5a5f",
        "circle-opacity": 0.7,
        "circle-stroke-color": "#ffb020",
        "circle-stroke-width": 1,
      },
    });
    map.on("click", "quake-circles", (e: MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f) return;
      const props = f.properties as { mag: number; place: string };
      new maplibregl.Popup()
        .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
        .setHTML(`<strong>M ${props.mag}</strong><br/>${props.place}`)
        .addTo(map);
    });
    map.on("mouseenter", "quake-circles", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "quake-circles", () => {
      map.getCanvas().style.cursor = "";
    });
  };

  useEffect(() => {
    updateQuakes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earthquakes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    if (selectedId.current !== null) {
      map.setFeatureState({ source: "districts", id: selectedId.current }, { selected: false });
    }
    selectedId.current = selectedDistrict;
    if (selectedDistrict !== null) {
      map.setFeatureState({ source: "districts", id: selectedDistrict }, { selected: true });
    }
  }, [selectedDistrict]);

  return <div ref={containerRef} className="h-full w-full" />;
}
