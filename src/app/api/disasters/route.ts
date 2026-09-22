import { NextResponse } from "next/server";
import { fetchDisasterSnapshot } from "@/lib/connectors/bipad";
import { fetchNepalEarthquakes } from "@/lib/connectors/usgs";

export const dynamic = "force-dynamic";

export async function GET() {
  const [snap, quakes] = await Promise.all([
    fetchDisasterSnapshot(30),
    fetchNepalEarthquakes(),
  ]);
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    hazards: snap.hazards,
    byHazard: snap.byHazard,
    incidents: snap.incidents,
    alerts: snap.alerts,
    rivers: snap.rivers,
    earthquakes: quakes,
  });
}
