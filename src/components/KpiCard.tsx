import { formatMetricValue, timeAgo } from "@/lib/format";
import type { Metric } from "@/lib/types";
import { FreshnessBadge } from "@/components/visual/FreshnessBadge";
import { RingGauge } from "@/components/visual/RingGauge";
import { SparkBars } from "@/components/visual/SparkBars";

function isPercentMetric(metric: Metric): boolean {
  if (metric.format === "percent") return true;
  if (typeof metric.value !== "number") return false;
  if (metric.unit === "%" && metric.value >= 0 && metric.value <= 100) return true;
  return false;
}

function accentFor(metric: Metric): string {
  if (metric.key.includes("aqi")) return "#FF9F1C";
  if (metric.key.includes("quake") || metric.key.includes("incident"))
    return "var(--danger)";
  if (metric.delta != null && metric.delta < 0) return "var(--danger)";
  return "var(--accent)";
}

export function KpiCard({ metric, large }: { metric: Metric; large?: boolean }) {
  const percent = isPercentMetric(metric);
  const numeric = typeof metric.value === "number";
  const color = accentFor(metric);

  return (
    <article
      className={`kpi-card animate-rise relative overflow-hidden rounded-sm p-4 ${
        large ? "md:col-span-2" : ""
      }`}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-20 blur-2xl"
        style={{ background: color }}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-2">
        <h3 className="max-w-[70%] text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          {metric.label}
        </h3>
        <FreshnessBadge freshness={metric.freshness} />
      </div>

      <div className="relative mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div
            className={`display font-medium tabular-nums tracking-tight ${
              large ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"
            }`}
          >
            {formatMetricValue(metric.value, metric.format, metric.unit)}
          </div>
          {metric.delta != null && (
            <div
              className={`mt-1 inline-flex items-center gap-1 text-xs ${
                metric.delta >= 0
                  ? "text-[var(--accent)]"
                  : "text-[var(--danger)]"
              }`}
            >
              <span aria-hidden>{metric.delta >= 0 ? "▲" : "▼"}</span>
              {metric.delta >= 0 ? "+" : ""}
              {metric.delta}% {metric.deltaLabel ?? ""}
            </div>
          )}
        </div>

        {percent && numeric ? (
          <RingGauge value={Number(metric.value)} color={color} size={large ? 84 : 68} />
        ) : (
          <SparkBars seed={metric.key} color={color} bars={large ? 14 : 10} />
        )}
      </div>

      <div className="relative mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[var(--muted)]">
        <span>{metric.source}</span>
        <span>·</span>
        <span>
          {metric.asOf.includes("T") ? timeAgo(metric.asOf) : metric.asOf}
        </span>
      </div>
      {metric.description && (
        <p className="relative mt-2 text-xs leading-relaxed text-[var(--muted)]">
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
