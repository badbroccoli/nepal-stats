import { MetricGrid } from "@/components/KpiCard";
import { SectionHeader, SourceStamp } from "@/components/SectionHeader";
import { NepalMap } from "@/components/NepalMap";
import { fetchNepalEarthquakes } from "@/lib/connectors/usgs";
import { getDomainMetrics } from "@/lib/connectors/pulse";
import { DOMAINS } from "@/lib/domains";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DisastersPage() {
  const quakes = await fetchNepalEarthquakes();
  const meta = DOMAINS.find((d) => d.id === "disasters")!;
  const metrics = getDomainMetrics("disasters").map((m) =>
    m.key === "quakes_30d"
      ? { ...m, value: quakes.length, asOf: new Date().toISOString() }
      : m,
  );

  return (
    <div>
      <SectionHeader
        title={meta.title}
        titleNp={meta.titleNp}
        blurb={meta.blurb}
      />
      <MetricGrid metrics={metrics} />
      <div className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <NepalMap quakes={quakes} height="480px" />
        <div className="panel rounded-sm p-4">
          <h2 className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            USGS events
          </h2>
          <ul className="space-y-2 text-sm">
            {quakes.length === 0 && (
              <li className="text-[var(--muted)]">No recent events in bbox.</li>
            )}
            {quakes.map((q) => (
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
