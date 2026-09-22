import { NextResponse } from "next/server";
import { getEarthquakes } from "@/lib/sources/usgs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sinceHours = Math.min(
    Math.max(Number(url.searchParams.get("sinceHours") ?? 168), 1),
    720,
  );
  const { events, stale } = await getEarthquakes(sinceHours);

  return NextResponse.json(
    {
      count: events.length,
      sinceHours,
      stale,
      source: "USGS FDSN Event API",
      events,
    },
    { headers: { "cache-control": "public, max-age=30, stale-while-revalidate=120" } },
  );
}
