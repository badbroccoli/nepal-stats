import { fetchNrbForex } from "@/lib/connectors/nrb";
import { CACHE_LIVE, jsonWithCache } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const rates = await fetchNrbForex();
  return jsonWithCache(
    { rates, generatedAt: new Date().toISOString() },
    CACHE_LIVE,
  );
}
