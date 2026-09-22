"use client";

/**
 * Primary map renderer. Uses an SVG choropleth so districts always paint,
 * including environments where MapLibre/WebGL canvas stays blank.
 * The MapLibre implementation remains in MapLibreNepalMap.tsx for later use.
 */
export { SvgNepalMap as NepalMap } from "./SvgNepalMap";
