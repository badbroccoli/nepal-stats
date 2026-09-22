import { fetchNepalNews } from "@/lib/connectors/news";
import { CACHE_LIVE, jsonWithCache } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const news = await fetchNepalNews();
  return jsonWithCache(
    { items: news, generatedAt: new Date().toISOString() },
    CACHE_LIVE,
  );
}
