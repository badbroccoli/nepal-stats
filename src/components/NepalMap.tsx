"use client";

/**
 * Primary map renderer. SVG choropleth with districts bundled at build time
 * so the map paints immediately (no MapLibre/WebGL, no /geo fetch).
 * MapLibreNepalMap.tsx remains available for a future basemap mode.
 */
export { SvgNepalMap as NepalMap } from "./SvgNepalMap";
