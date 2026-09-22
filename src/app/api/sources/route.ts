import { getCountrySources } from "@/lib/countrySources";
import { isCountryCode } from "@/lib/countries";
import { probeAgency } from "@/lib/connectors/officialStats";
import { CACHE_METRICS, CACHE_NONE, jsonWithCache } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("country") || "us").toLowerCase();
  if (!isCountryCode(raw)) {
    return jsonWithCache({ error: "Unknown country" }, CACHE_NONE, {
      status: 404,
    });
  }
  const profile = getCountrySources(raw);
  if (!profile) {
    return jsonWithCache({ error: "No sources" }, CACHE_NONE, { status: 404 });
  }

  const shouldProbe = searchParams.get("probe") === "1";
  let probes: Array<{
    name: string;
    url: string;
    ok: boolean;
    status: number;
    ms: number;
  }> = [];

  if (shouldProbe) {
    // Probe up to 6 agencies so the request stays snappy
    const slice = profile.agencies.slice(0, 6);
    probes = await Promise.all(
      slice.map(async (a) => {
        const r = await probeAgency(a.url);
        return { name: a.name, url: a.url, ...r };
      }),
    );
  }

  return jsonWithCache(
    {
      country: raw,
      preferred: profile.preferred,
      agencies: profile.agencies,
      probes: shouldProbe ? probes : undefined,
      generatedAt: new Date().toISOString(),
    },
    CACHE_METRICS,
  );
}
