import { fetchCountryNews } from "@/lib/connectors/news";
import { getCountry, isCountryCode } from "@/lib/countries";
import { CACHE_LIVE, jsonWithCache } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("country") || "np").toLowerCase();
  const code = isCountryCode(raw) ? raw : "us";
  const country = getCountry(code)!;
  const news = await fetchCountryNews(country.code, country.name);
  return jsonWithCache(
    { items: news, country: code, generatedAt: new Date().toISOString() },
    CACHE_LIVE,
  );
}
