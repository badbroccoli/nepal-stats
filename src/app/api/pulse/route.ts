import { buildPulse } from "@/lib/connectors/pulse";
import { isCountryCode } from "@/lib/countries";
import { CACHE_LIVE, jsonWithCache } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("country") || "np").toLowerCase();
  const code = isCountryCode(raw) ? raw : "np";
  const pulse = await buildPulse(code);
  return jsonWithCache(pulse, CACHE_LIVE);
}
