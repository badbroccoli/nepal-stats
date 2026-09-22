import { fetchNepalEarthquakes } from "@/lib/connectors/usgs";
import { CACHE_LIVE, jsonWithCache } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const quakes = await fetchNepalEarthquakes();
  return jsonWithCache(
    { items: quakes, generatedAt: new Date().toISOString() },
    CACHE_LIVE,
  );
}
