import { getDomainMetrics } from "@/lib/connectors/pulse";
import type { DomainId } from "@/lib/types";
import { DOMAINS } from "@/lib/domains";
import { CACHE_METRICS, CACHE_NONE, jsonWithCache } from "@/lib/http";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ domain: string }> },
) {
  const { domain } = await ctx.params;
  const meta = DOMAINS.find((d) => d.id === domain);
  if (!meta) {
    return jsonWithCache({ error: "Unknown domain" }, CACHE_NONE, {
      status: 404,
    });
  }
  return jsonWithCache(
    {
      domain: meta,
      metrics: getDomainMetrics(domain as DomainId),
      generatedAt: new Date().toISOString(),
    },
    CACHE_METRICS,
  );
}
