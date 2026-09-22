import { fetchFrankfurterForex } from "@/lib/connectors/forex";
import { CACHE_LIVE, jsonWithCache } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currency = searchParams.get("currency");
  const rates = await fetchFrankfurterForex(currency);
  return jsonWithCache(
    { rates, generatedAt: new Date().toISOString() },
    CACHE_LIVE,
  );
}
