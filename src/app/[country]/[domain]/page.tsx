import { AgePyramidChart, SimpleArea, SimpleBars } from "@/components/Charts";
import { CabinetRoster } from "@/components/CabinetRoster";
import { CountryMap } from "@/components/CountryMap";
import { DomainPage } from "@/components/DomainPage";
import { MetricGrid } from "@/components/KpiCard";
import { NewsRail } from "@/components/NewsRail";
import { SectionHeader, SourceStamp } from "@/components/SectionHeader";
import { fetchDisasterSnapshot } from "@/lib/connectors/bipad";
import { getCountryDomainMetrics } from "@/lib/connectors/domainMetrics";
import { fetchCountryGovernment } from "@/lib/connectors/government";
import { fetchCountryNews } from "@/lib/connectors/news";
import { fetchEarthquakesInBBox } from "@/lib/connectors/usgs";
import { countryBBox, getCountry } from "@/lib/countries";
import { domainsFor, isDomainId, PROVINCE_NAMES } from "@/lib/domains";
import { timeAgo } from "@/lib/format";
import { AGE_PYRAMID, CALENDAR_EVENTS } from "@/lib/seed/metrics";
import type { DisasterIncident, DomainId } from "@/lib/types";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const remittanceTrend = [
  { year: "FY21", bn: 961 },
  { year: "FY22", bn: 1007 },
  { year: "FY23", bn: 1220 },
  { year: "FY24", bn: 1444 },
  { year: "FY25", bn: 1724 },
  { year: "FY26", bn: 2363 },
];

const trade = [
  { name: "Exports Δ", value: 13.8 },
  { name: "Imports Δ", value: 16.2 },
  { name: "CPI", value: 5.14 },
  { name: "GDP g", value: 3.85 },
];

const fiscal = [
  { name: "Revenue", value: 1120 },
  { name: "Spend", value: 1450 },
  { name: "Transfers", value: 420 },
  { name: "Capital", value: 261 },
];

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
    const incidents =
      country.code === "np"
        ? await fetchDisasterSnapshot(30).then((s) => s.incidents)
        : quakesAsIncidents(quakes);
    return (
      <div>
        <SectionHeader
          title="Places"
          titleNp={country.name}
          blurb={
            country.code === "np"
              ? "OpenFreeMap street basemap with district choropleth — zoom for roads and place names."
              : `Interactive map centered on ${country.name}. Streets via OpenFreeMap; hazard dots from USGS when available.`
          }
        />
        <CountryMap
          country={country}
          incidents={incidents}
          quakes={quakes}
          height="640px"
        />
        {country.code === "np" && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(PROVINCE_NAMES).map(([pid, names]) => (
              <div key={pid} className="panel rounded-sm p-4">
                <div className="text-xs text-[var(--muted)]">Province {pid}</div>
                <div className="display mt-1 text-xl">{names.en}</div>
                <div className="text-sm text-[var(--muted)]">{names.np}</div>
              </div>
            ))}
          </div>
        )}
        <SourceStamp />
      </div>
    );
  }

  if (id === "news") {
    const news = await fetchCountryNews(country.code, country.name);
    return (
      <div>
        <SectionHeader
          title="News & Calendar"
          titleNp={country.name}
          blurb={
            country.code === "np"
              ? "Aggregated headlines from Nepali outlets, plus a release calendar."
              : `Live headlines mentioning ${country.name} (Google News RSS).`
          }
        />
        <div
          className={`grid gap-4 ${country.code === "np" ? "lg:grid-cols-[1.2fr_0.8fr]" : ""}`}
        >
          <div className="min-h-[520px]">
            <NewsRail
              items={news}
              title={
                country.code === "np"
                  ? "Live Nepali news"
                  : `Live ${country.name} news`
              }
            />
          </div>
          {country.code === "np" && (
            <div className="panel rounded-sm p-4">
              <h2 className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Release & holiday calendar
              </h2>
              <ul className="space-y-3">
                {CALENDAR_EVENTS.map((e) => (
                  <li
                    key={e.date + e.title}
                    className="border-b border-[var(--border)] pb-3"
                  >
                    <div className="mono text-xs text-[var(--accent)]">
                      {e.date}
                    </div>
                    <div className="mt-1 text-sm">{e.title}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      {e.type}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <SourceStamp />
      </div>
    );
  }

  if (id === "government") {
    const government = await fetchCountryGovernment(
      country.code,
      country.name,
    );
    return (
      <DomainPage id="government" countryCode={country.code}>
        <CabinetRoster government={government} countryName={country.name} />
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
        {country.code === "np" && (
          <div className="mt-8">
            <h2 className="mb-3 display text-xl">
              Fiscal flows (bn NPR, indicative)
            </h2>
            <SimpleBars data={fiscal} xKey="name" yKey="value" color="#E8A87C" />
          </div>
        )}
      </DomainPage>
    );
  }

  if (id === "disasters") {
    const bbox = countryBBox(country);
    const quakes = await fetchEarthquakesInBBox(bbox);
    const snap =
      country.code === "np"
        ? await fetchDisasterSnapshot(30)
        : {
            incidents: quakesAsIncidents(quakes),
            alerts: [],
            rivers: { monitored: 0, elevated: 0, danger: 0 },
            byHazard: [],
            hazards: [],
          };
    const meta = domainsFor(country.code).find((d) => d.id === "disasters")!;
    const now = new Date().toISOString();
    const seedOrLive = await getCountryDomainMetrics("disasters", country);
    const metrics =
      country.code === "np"
        ? seedOrLive.map((m) => {
            if (m.key === "incidents_30d") {
              return { ...m, value: snap.incidents.length, asOf: now };
            }
            if (m.key === "quakes_30d") {
              return { ...m, value: quakes.length, asOf: now };
            }
            if (m.key === "active_alerts") {
              return { ...m, value: snap.alerts.length, asOf: now };
            }
            return m;
          })
        : [
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
              value: snap.incidents.length,
              freshness: "RT" as const,
              source: "USGS",
              asOf: now,
              format: "number" as const,
            },
            ...seedOrLive,
          ].slice(0, 6);
    const mapIncidents = [
      ...snap.incidents,
      ...quakesAsIncidents(quakes),
    ].slice(0, 400);

    return (
      <div>
        <SectionHeader
          title={meta.title}
          titleNp={meta.titleNp}
          blurb={
            country.code === "np"
              ? "BIPAD natural hazards across Nepal plus USGS seismicity."
              : `USGS seismicity near ${country.name}. Local multi-hazard feeds can be plugged in per country the same way BIPAD is for Nepal.`
          }
        />
        <MetricGrid metrics={metrics} />
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <CountryMap
            country={country}
            incidents={mapIncidents}
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

  if (id === "people") {
    return (
      <DomainPage id="people" countryCode={country.code}>
        {country.code === "np" && (
          <div className="mt-8">
            <h2 className="mb-3 display text-xl">
              Age structure (illustrative millions)
            </h2>
            <AgePyramidChart data={AGE_PYRAMID} />
          </div>
        )}
      </DomainPage>
    );
  }

  if (id === "economy") {
    return (
      <DomainPage id="economy" countryCode={country.code}>
        {country.code === "np" && (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 display text-xl">
                Remittance inflows (bn NPR)
              </h2>
              <SimpleArea data={remittanceTrend} xKey="year" yKey="bn" />
            </div>
            <div>
              <h2 className="mb-3 display text-xl">Macro snapshot (%)</h2>
              <SimpleBars
                data={trade}
                xKey="name"
                yKey="value"
                color="#F4D35E"
              />
            </div>
          </div>
        )}
      </DomainPage>
    );
  }

  return <DomainPage id={id} countryCode={country.code} />;
}
