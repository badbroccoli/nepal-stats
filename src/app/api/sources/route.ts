import { getCountrySources } from "@/lib/countrySources";
import { isCountryCode, getCountry } from "@/lib/countries";
import {
  probeAgency,
  probePopulationAccuracy,
} from "@/lib/connectors/officialStats";
import { fetchWorldBankPopulation } from "@/lib/connectors/worldbank";
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
  const shouldAccuracy =
    searchParams.get("accuracy") === "1" || shouldProbe;

  let probes: Array<{
    name: string;
    url: string;
    tier: string;
    ok: boolean;
    status: number;
    ms: number;
  }> = [];

  if (shouldProbe) {
    // Probe federal first, then others — up to 8 so the request stays snappy
    const ordered = [...profile.agencies].sort((a, b) => {
      const rank = (t: string) =>
        t === "federal" ? 0 : t === "state" ? 1 : t === "local" ? 2 : 3;
      return rank(a.tier) - rank(b.tier);
    });
    const slice = ordered.slice(0, 8);
    probes = await Promise.all(
      slice.map(async (a) => {
        const r = await probeAgency(a.url);
        return { name: a.name, url: a.url, tier: a.tier, ...r };
      }),
    );
  }

  let accuracy = undefined;
  if (shouldAccuracy) {
    const country = getCountry(raw);
    const wb = country
      ? await fetchWorldBankPopulation(country.iso3)
      : null;
    const probe = await probePopulationAccuracy(raw, wb);
    accuracy = {
      chosen: probe.chosen,
      reason: probe.reason,
      deltaPct:
        probe.deltaPct == null
          ? null
          : Math.round(probe.deltaPct * 10000) / 100,
      withinTolerance: probe.withinTolerance,
      worldBank: probe.worldBank,
      official: probe.official
        ? {
            value: probe.official.value,
            asOf: probe.official.asOf,
            source: probe.official.source,
            connector: probe.official.connector,
            tier: probe.official.tier,
          }
        : null,
      candidates: probe.candidates.map((c) => ({
        value: c.value,
        asOf: c.asOf,
        connector: c.connector,
        source: c.source,
        tier: c.tier,
      })),
    };
  }

  return jsonWithCache(
    {
      country: raw,
      preferred: profile.preferred,
      agencies: profile.agencies,
      probes: shouldProbe ? probes : undefined,
      accuracy,
      generatedAt: new Date().toISOString(),
    },
    CACHE_METRICS,
  );
}
