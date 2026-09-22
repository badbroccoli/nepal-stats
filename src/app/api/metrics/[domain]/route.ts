import { getCountryDomainMetrics } from "@/lib/connectors/domainMetrics";
import { getCountry, isCountryCode } from "@/lib/countries";
import { domainsFor, isDomainId } from "@/lib/domains";
import type { DomainId } from "@/lib/types";
import { CACHE_METRICS, CACHE_NONE, jsonWithCache } from "@/lib/http";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ domain: string }> },
) {
  const { domain } = await ctx.params;
  if (!isDomainId(domain)) {
    return jsonWithCache({ error: "Unknown domain" }, CACHE_NONE, {
      status: 404,
    });
  }
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("country") || "np").toLowerCase();
  const code = isCountryCode(raw) ? raw : "np";
  const country = getCountry(code)!;
  const meta = domainsFor(code).find((d) => d.id === domain)!;
  const metrics = await getCountryDomainMetrics(domain as DomainId, country);

  return jsonWithCache(
    {
      domain: meta,
      country: code,
      metrics,
      generatedAt: new Date().toISOString(),
    },
    CACHE_METRICS,
  );
}
