import { NextResponse } from "next/server";

/** Live connector feeds that refresh often. */
export const CACHE_LIVE =
  "public, s-maxage=60, stale-while-revalidate=120";

/** Domain metrics and similar semi-static JSON. */
export const CACHE_METRICS =
  "public, s-maxage=300, stale-while-revalidate=600";

/** Rarely changing assets (e.g. GeoJSON). */
export const CACHE_STATIC =
  "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";

/** Explicitly uncacheable responses. */
export const CACHE_NONE = "no-store";

export function jsonWithCache(
  data: unknown,
  cacheControl: string,
  init?: ResponseInit,
): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", cacheControl);
  return NextResponse.json(data, { ...init, headers });
}
