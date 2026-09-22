import { CountryMap } from "@/components/CountryMap";
import { CabinetRoster } from "@/components/CabinetRoster";
import { DomainCharts } from "@/components/DomainCharts";
import { DomainPage } from "@/components/DomainPage";
import { MetricGrid } from "@/components/KpiCard";
import { NewsRail } from "@/components/NewsRail";
import { SectionHeader, SourceStamp } from "@/components/SectionHeader";
import { getDomainCharts } from "@/lib/connectors/domainMetrics";
import { fetchCountryGovernment } from "@/lib/connectors/government";
import { fetchCountryNews } from "@/lib/connectors/news";
import { fetchEarthquakesInBBox } from "@/lib/connectors/usgs";
import { countryBBox, getCountry } from "@/lib/countries";
import { domainsFor, isDomainId } from "@/lib/domains";
import { timeAgo } from "@/lib/format";
import type { DisasterIncident, DomainId } from "@/lib/types";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function quakesAsIncidents(
  quakes: Awaited<ReturnType<typeof fetchEarthquakesInBBox>>,
): DisasterIncident[] {
  return quakes.map((q) => ({
    id: `usgs-${q.id}`,
    source: "usgs" as const,
    hazardId: 8,
    hazard: "Earthquake",
    hazardColor: "#FF6B6B",
    title: `M${q.mag} · ${q.place}`,
    time: q.time,
    lat: q.lat,
    lon: q.lon,
    url: q.url,
    mag: q.mag,
    depth: q.depth,
  }));
}

export default async function CountryDomainPage({
  params,
}: {
  params: Promise<{ country: string; domain: string }>;
}) {
  const { country: code, domain } = await params;
  const country = getCountry(code);
  if (!country || !isDomainId(domain)) notFound();
  const id = domain as DomainId;

  if (id === "places") {
    const quakes = await fetchEarthquakesInBBox(countryBBox(country));
    return (
      <div>
        <SectionHeader
          title="Places"
          titleNp={country.name}
          blurb={`Interactive map centered on ${country.name}. Streets via OpenFreeMap; hazard dots from USGS when available.`}
        />
        <CountryMap
          country={country}
          incidents={quakesAsIncidents(quakes)}
          quakes={quakes}
          height="640px"
        />
        <SourceStamp />
      </div>
    );
  }

  if (id === "news") {
    const news = await fetchCountryNews(country.code, country.name);
    return (
      <div>
        <SectionHeader
          title="News"
          titleNp={country.name}
          blurb={`Live headlines mentioning ${country.name} (Google News RSS).`}
        />
        <div className="min-h-[520px]">
          <NewsRail items={news} title={`Live ${country.name} news`} />
        </div>
        <SourceStamp />
      </div>
    );
  }

  if (id === "government") {
    const [government, charts] = await Promise.all([
      fetchCountryGovernment(country.code, country.name),
      getDomainCharts("government", country),
    ]);
    return (
      <DomainPage id="government" countryCode={country.code}>
        <CabinetRoster government={government} countryName={country.name} />
        <DomainCharts charts={charts} />
        <div className="panel mt-8 rounded-sm p-5">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={country.flag}
              alt=""
              width={48}
              height={32}
              className="h-8 w-12 rounded-[2px] object-cover"
            />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Country profile
              </div>
              <h2 className="display text-2xl">{country.name}</h2>
            </div>
          </div>
          <dl className="mono mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-3 border-b border-[var(--border)] py-2">
              <dt className="text-[var(--muted)]">Capital</dt>
              <dd>{country.capital || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--border)] py-2">
              <dt className="text-[var(--muted)]">Region</dt>
              <dd>{country.subregion || country.region}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--border)] py-2">
              <dt className="text-[var(--muted)]">ISO</dt>
              <dd>
                {country.code.toUpperCase()} / {country.iso3.toUpperCase()}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-[var(--border)] py-2">
              <dt className="text-[var(--muted)]">Currency</dt>
              <dd>{country.currency || "—"}</dd>
            </div>
          </dl>
        </div>
      </DomainPage>
    );
  }

  if (id === "disasters") {
    const bbox = countryBBox(country);
    const quakes = await fetchEarthquakesInBBox(bbox);
    const incidents = quakesAsIncidents(quakes);
    const meta = domainsFor(country.code).find((d) => d.id === "disasters")!;
    const now = new Date().toISOString();
    const metrics = [
      {
        key: "quakes_30d",
        label: "Earthquakes (bbox)",
        value: quakes.length,
        freshness: "RT" as const,
        source: "USGS",
        asOf: now,
        format: "number" as const,
      },
      {
        key: "incidents_30d",
        label: "Hazard events",
        value: incidents.length,
        freshness: "RT" as const,
        source: "USGS",
        asOf: now,
        format: "number" as const,
      },
    ];

    return (
      <div>
        <SectionHeader
          title={meta.title}
          titleNp={meta.titleNp}
          blurb={`USGS seismicity near ${country.name}. Local multi-hazard feeds can be added per country when available.`}
        />
        <MetricGrid metrics={metrics} />
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <CountryMap
            country={country}
            incidents={incidents}
            quakes={quakes}
            height="480px"
          />
          <div className="panel rounded-sm p-4">
            <h2 className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              USGS earthquakes
            </h2>
            <ul className="space-y-2 text-sm">
              {quakes.length === 0 && (
                <li className="text-[var(--muted)]">
                  No recent events in this window.
                </li>
              )}
              {quakes.slice(0, 12).map((q) => (
                <li key={q.id} className="border-b border-[var(--border)] pb-2">
                  <a href={q.url} target="_blank" rel="noopener noreferrer">
                    <span className="mono text-[var(--danger)]">M{q.mag}</span>{" "}
                    {q.place}
                  </a>
                  <div className="text-[10px] text-[var(--muted)]">
                    {timeAgo(q.time)} · depth {q.depth.toFixed(1)} km
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <SourceStamp />
      </div>
    );
  }

  // Standard domain: metrics + World Bank trend charts
  const charts = await getDomainCharts(id, country);
  return (
    <DomainPage id={id} countryCode={country.code}>
      <DomainCharts charts={charts} />
    </DomainPage>
  );
}
