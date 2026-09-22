import { formatMetricValue, timeAgo } from "@/lib/format";
import type { Metric } from "@/lib/types";

export function KpiCard({ metric, large }: { metric: Metric; large?: boolean }) {
  return (
    <article
      className={`panel animate-rise rounded-sm p-4 ${large ? "md:col-span-2" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          {metric.label}
        </h3>
        <span className="mono text-[10px] text-[var(--muted)]">
          {metric.freshness}
        </span>
      </div>
      <div
        className={`display mt-2 font-medium tabular-nums ${
          large ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"
        }`}
      >
        {formatMetricValue(metric.value, metric.format, metric.unit)}
      </div>
      {metric.delta != null && (
        <div
          className={`mt-1 text-xs ${
            metric.delta >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]"
          }`}
        >
          {metric.delta >= 0 ? "+" : ""}
          {metric.delta}% {metric.deltaLabel ?? ""}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[var(--muted)]">
        <span>{metric.source}</span>
        <span>·</span>
        <span>
          {metric.asOf.includes("T") ? timeAgo(metric.asOf) : metric.asOf}
        </span>
      </div>
      {metric.description && (
        <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
          {metric.description}
        </p>
      )}
    </article>
  );
}

export function MetricGrid({ metrics }: { metrics: Metric[] }) {
  if (!metrics.length) {
    return (
      <p className="text-sm text-[var(--muted)]">
        No curated metrics for this section yet.
      </p>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((m) => (
        <KpiCard key={m.key} metric={m} />
      ))}
    </div>
  );
}
