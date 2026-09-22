import { MetricGrid } from "@/components/KpiCard";
import { SectionHeader, SourceStamp } from "@/components/SectionHeader";
import { NepalMap } from "@/components/NepalMap";
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

  return (
    <div>
      <SectionHeader
        title={meta.title}
        titleNp={meta.titleNp}
        blurb="Live BIPAD natural hazards across Nepal — floods, landslides, fire, thunderbolt, wind storm, quakes, and more — plus USGS seismicity and DHM river alerts."
      />
      <MetricGrid metrics={metrics} />

      {snap.byHazard.length > 0 && (
        <div className="mt-6 panel rounded-sm p-4">
          <h2 className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Natural hazard mix (30d)
          </h2>
          <div className="flex flex-wrap gap-2">
            {snap.byHazard.map((h) => (
              <div
                key={h.hazard}
                className="flex items-center gap-2 border border-[var(--border)] px-3 py-2 text-sm"
              >
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0"
                  style={{ background: h.color }}
                  aria-hidden
                />
                <span>{h.hazard}</span>
                <span className="mono text-[var(--muted)]">{h.count}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-[var(--muted)]">
            {snap.hazards.length} BIPAD natural hazard types tracked · counts
            capped per type for freshness
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <NepalMap incidents={mapIncidents} quakes={quakes} height="480px" />
        <div className="space-y-4">
          {snap.alerts.length > 0 && (
            <div className="panel rounded-sm p-4">
              <h2 className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Active alerts
              </h2>
              <ul className="space-y-2 text-sm">
                {snap.alerts.slice(0, 8).map((a) => (
                  <li key={a.id} className="border-b border-[var(--border)] pb-2">
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-1 inline-block h-2 w-2 shrink-0"
                        style={{ background: a.hazardColor }}
                      />
                      <div>
                        <div>{a.title}</div>
                        <div className="text-[10px] text-[var(--muted)]">
                          {a.hazard} · {timeAgo(a.startedOn)}
                          {a.expireOn ? ` · expires ${timeAgo(a.expireOn)}` : ""}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="panel rounded-sm p-4">
            <h2 className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              Recent natural incidents (BIPAD)
            </h2>
            <ul className="max-h-[420px] space-y-2 overflow-y-auto text-sm">
              {feed.length === 0 && (
                <li className="text-[var(--muted)]">
                  No recent BIPAD natural incidents in the lookback window.
                </li>
              )}
              {feed.map((i) => (
                <li key={i.id} className="border-b border-[var(--border)] pb-2">
                  <a
                    href={i.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2"
                  >
                    <span
                      className="mt-1 inline-block h-2 w-2 shrink-0"
                      style={{ background: i.hazardColor }}
                      title={i.hazard}
                    />
                    <span>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        {i.hazard}
                      </span>
                      <div>{i.title}</div>
                      <div className="text-[10px] text-[var(--muted)]">
                        {timeAgo(i.time)}
                      </div>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel rounded-sm p-4">
            <h2 className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              USGS earthquakes
            </h2>
            <ul className="space-y-2 text-sm">
              {quakes.length === 0 && (
                <li className="text-[var(--muted)]">No recent events in bbox.</li>
              )}
              {quakes.slice(0, 8).map((q) => (
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
      </div>
      <SourceStamp />
    </div>
  );
}
