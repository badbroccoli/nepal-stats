import { MetricGrid } from "@/components/KpiCard";
import { SectionHeader, SourceStamp } from "@/components/SectionHeader";
import { NepalMap } from "@/components/NepalMap";
import { DonutMix } from "@/components/Charts";
import {
  DisasterFeed,
  HazardMixBars,
} from "@/components/visual/HazardVisuals";
import { fetchDisasterSnapshot } from "@/lib/connectors/bipad";
import { fetchNepalEarthquakes } from "@/lib/connectors/usgs";
import { getDomainMetrics } from "@/lib/connectors/pulse";
import { DOMAINS } from "@/lib/domains";
import { timeAgo } from "@/lib/format";
import type { DisasterIncident } from "@/lib/types";

export const dynamic = "force-dynamic";

function quakesAsIncidents(
  quakes: Awaited<ReturnType<typeof fetchNepalEarthquakes>>,
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

export default async function DisastersPage() {
  const [snap, quakes] = await Promise.all([
    fetchDisasterSnapshot(30),
    fetchNepalEarthquakes(),
  ]);
  const meta = DOMAINS.find((d) => d.id === "disasters")!;
  const now = new Date().toISOString();
  const metrics = getDomainMetrics("disasters").map((m) => {
    if (m.key === "incidents_30d") {
      return { ...m, value: snap.incidents.length, asOf: now };
    }
    if (m.key === "quakes_30d") {
      return { ...m, value: quakes.length, asOf: now };
    }
    if (m.key === "active_alerts") {
      return { ...m, value: snap.alerts.length, asOf: now };
    }
    if (m.key === "flood_stations") {
      return { ...m, value: snap.rivers.monitored, asOf: now };
    }
    if (m.key === "rivers_elevated") {
      return { ...m, value: snap.rivers.elevated, asOf: now };
    }
    return m;
  });

  const mapIncidents = [
    ...snap.incidents,
    ...quakesAsIncidents(quakes),
  ].slice(0, 400);

  const feed = snap.incidents.slice(0, 40);
  const totalHazards = snap.byHazard.reduce((s, h) => s + h.count, 0);

  return (
    <div>
      <SectionHeader
        title={meta.title}
        titleNp={meta.titleNp}
        blurb="Live BIPAD natural hazards across Nepal — floods, landslides, fire, thunderbolt, wind storm, quakes, and more — plus USGS seismicity and DHM river alerts."
        accent={meta.accent}
      />
      <MetricGrid metrics={metrics} />

      {snap.byHazard.length > 0 && (
        <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="section-kicker mb-2">Composition</div>
            <h2 className="display mb-3 text-xl">Hazard mix (30d)</h2>
            <DonutMix
              data={snap.byHazard.map((h) => ({
                name: h.hazard,
                value: h.count,
                color: h.color,
              }))}
              centerLabel="events"
              centerValue={String(totalHazards)}
            />
          </div>
          <div className="panel rounded-sm p-5">
            <div className="section-kicker mb-2">Breakdown</div>
            <h2 className="display mb-4 text-xl">Share by hazard type</h2>
            <HazardMixBars
              items={snap.byHazard.map((h) => ({
                hazard: h.hazard,
                count: h.count,
                color: h.color,
              }))}
            />
            <p className="mt-4 text-[10px] text-[var(--muted)]">
              {snap.hazards.length} BIPAD natural hazard types tracked · counts
              capped per type for freshness
            </p>
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="section-kicker">Map</div>
              <h2 className="display mt-1 text-xl">Incidents & seismicity</h2>
            </div>
          </div>
          <NepalMap incidents={mapIncidents} quakes={quakes} height="480px" />
        </div>
        <div className="space-y-4">
          {snap.alerts.length > 0 && (
            <div className="panel rounded-sm p-4">
              <div className="section-kicker mb-2">Alerts</div>
              <h2 className="display mb-3 text-lg">Active alerts</h2>
              <ul className="space-y-2 text-sm">
                {snap.alerts.slice(0, 8).map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 border-b border-[var(--border)] pb-2"
                  >
                    <span
                      className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px]"
                      style={{
                        background: `${a.hazardColor}22`,
                        color: a.hazardColor,
                        boxShadow: `0 0 0 1px ${a.hazardColor}44`,
                      }}
                    >
                      !!
                    </span>
                    <div>
                      <div>{a.title}</div>
                      <div className="text-[10px] text-[var(--muted)]">
                        {a.hazard} · {timeAgo(a.startedOn)}
                        {a.expireOn ? ` · expires ${timeAgo(a.expireOn)}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="panel rounded-sm p-4">
            <div className="section-kicker mb-2">BIPAD</div>
            <h2 className="display mb-3 text-lg">Recent natural incidents</h2>
            <div className="max-h-[420px] overflow-y-auto">
              <DisasterFeed disasters={feed} />
            </div>
          </div>

          <div className="panel rounded-sm p-4">
            <div className="section-kicker mb-2">USGS</div>
            <h2 className="display mb-3 text-lg">Earthquakes</h2>
            <ul className="space-y-2 text-sm">
              {quakes.length === 0 && (
                <li className="text-[var(--muted)]">
                  No recent events in bbox.
                </li>
              )}
              {quakes.slice(0, 8).map((q) => {
                const intensity = Math.min(1, Math.max(0.2, q.mag / 7));
                return (
                  <li
                    key={q.id}
                    className="flex items-center gap-3 border-b border-[var(--border)] pb-2"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-sm"
                      style={{
                        background: `rgba(255,107,107,${0.12 + intensity * 0.35})`,
                        boxShadow: `inset 0 0 0 1px rgba(255,107,107,${0.3 + intensity * 0.4})`,
                      }}
                    >
                      <span className="mono text-sm leading-none text-[var(--danger)]">
                        {q.mag.toFixed(1)}
                      </span>
                      <span className="text-[8px] uppercase text-[var(--muted)]">
                        mag
                      </span>
                    </div>
                    <div className="min-w-0">
                      <a
                        href={q.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="line-clamp-2 hover:text-[var(--accent)]"
                      >
                        {q.place}
                      </a>
                      <div className="text-[10px] text-[var(--muted)]">
                        {timeAgo(q.time)} · depth {q.depth.toFixed(1)} km
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      <SourceStamp />
    </div>
  );
}
