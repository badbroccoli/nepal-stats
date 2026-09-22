import { buildPulse } from "@/lib/connectors/pulse";
import { CACHE_LIVE, jsonWithCache } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const pulse = await buildPulse();
  return jsonWithCache(pulse, CACHE_LIVE);
}
