"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { MapLibreNepalMap } from "./MapLibreNepalMap";
import { SvgNepalMap } from "./SvgNepalMap";
import type { DisasterIncident, QuakeEvent } from "@/lib/types";

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

const emptySubscribe = () => () => {};

/**
 * Prefer MapLibre + OpenFreeMap streets (Google/Apple-like zoom).
 * Fall back to the SVG choropleth when WebGL/basemap cannot paint.
 */
export function NepalMap({
  quakes = [],
  incidents = [],
  height = "520px",
}: {
  quakes?: QuakeEvent[];
  incidents?: DisasterIncident[];
  height?: string;
}) {
  const webglOk = useSyncExternalStore(
    emptySubscribe,
    supportsWebGL,
    () => true,
  );
  const [forceSvg, setForceSvg] = useState(false);
  const useSvg = forceSvg || !webglOk;

  const fallBackToSvg = useCallback(() => {
    setForceSvg(true);
  }, []);

  if (useSvg) {
    return (
      <SvgNepalMap quakes={quakes} incidents={incidents} height={height} />
    );
  }

  return (
    <MapLibreNepalMap
      quakes={quakes}
      incidents={incidents}
      height={height}
      onUnavailable={fallBackToSvg}
    />
  );
}
