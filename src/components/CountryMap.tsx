"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  Marker,
} from "maplibre-gl";
import type { Country } from "@/lib/countries";
import type { DisasterIncident, QuakeEvent } from "@/lib/types";
import { NepalMap } from "./NepalMap";

export function CountryMap({
  country,
  quakes = [],
  incidents = [],
  height = "520px",
}: {
  country: Country;
  quakes?: QuakeEvent[];
  incidents?: DisasterIncident[];
  height?: string;
}) {
  if (country.code === "np") {
    return (
      <NepalMap quakes={quakes} incidents={incidents} height={height} />
    );
  }

  return (
    <GenericCountryMap country={country} quakes={quakes} height={height} />
  );
}

function GenericCountryMap({
  country,
  quakes,
  height,
}: {
  country: Country;
  quakes: QuakeEvent[];
  height: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [country.lng, country.lat],
      zoom: country.areaKm2 && country.areaKm2 > 2_000_000 ? 3.2 : 5.2,
      minZoom: 2,
      maxZoom: 16,
      failIfMajorPerformanceCaveat: false,
    });
    map.addControl(new NavigationControl({ showCompass: true }), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      setStatus("ready");
      new Marker({ color: "#3DDC97" })
        .setLngLat([country.lng, country.lat])
        .addTo(map);
    });
    map.on("error", () => setStatus("error"));

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);
    requestAnimationFrame(() => map.resize());

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [country.code, country.lat, country.lng, country.areaKm2]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    map.flyTo({
      center: [country.lng, country.lat],
      zoom: country.areaKm2 && country.areaKm2 > 2_000_000 ? 3.2 : 5.2,
      essential: true,
    });
  }, [country, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    // Clear previous markers layer-ish by re-adding simple markers via DOM —
    // keep it light: only show up to 20 quakes.
    const markers: Marker[] = [];
    for (const q of quakes.slice(0, 20)) {
      const el = document.createElement("div");
      el.style.width = "10px";
      el.style.height = "10px";
      el.style.borderRadius = "999px";
      el.style.background = "#ff6b6b";
      el.style.boxShadow = "0 0 0 3px rgba(255,107,107,0.25)";
      el.title = `M${q.mag} · ${q.place}`;
      markers.push(new Marker({ element: el }).setLngLat([q.lon, q.lat]).addTo(map));
    }
    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [quakes, status]);

  return (
    <div
      className="panel relative overflow-hidden rounded-sm"
      style={{ height }}
    >
      <div ref={containerRef} className="h-full w-full" />
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#070807]/50 text-xs uppercase tracking-wider text-[var(--muted)]">
          Loading {country.name} map…
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded bg-[#050505cc] px-2.5 py-2 text-[10px] text-[var(--muted)]">
        <div className="uppercase tracking-wider">
          {country.name} · streets &amp; hazards
        </div>
        <div className="mt-1 normal-case tracking-normal">
          OpenFreeMap basemap · USGS quake dots when available
        </div>
      </div>
    </div>
  );
}
