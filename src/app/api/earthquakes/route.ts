import { NextResponse } from "next/server";
import { fetchNepalEarthquakes } from "@/lib/connectors/usgs";

export const dynamic = "force-dynamic";

export async function GET() {
  const quakes = await fetchNepalEarthquakes();
  return NextResponse.json({ items: quakes, generatedAt: new Date().toISOString() });
}
