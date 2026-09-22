import { fetchEarthquakesInBBox } from "@/lib/connectors/usgs";
import { countryBBox, getCountry, isCountryCode } from "@/lib/countries";
import { CACHE_LIVE, jsonWithCache } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("country") || "us").toLowerCase();
  const code = isCountryCode(raw) ? raw : "us";
  const country = getCountry(code)!;
  const quakes = await fetchEarthquakesInBBox(countryBBox(country));
  return jsonWithCache(
    { items: quakes, country: code, generatedAt: new Date().toISOString() },
    CACHE_LIVE,
  );
}
