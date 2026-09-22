import { TrendChart } from "@/components/Charts";
import type { DomainChartData } from "@/lib/connectors/domainMetrics";

export function DomainCharts({ charts }: { charts: DomainChartData[] }) {
  if (!charts.length) return null;

  return (
    <section className="mt-8 space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="display text-xl md:text-2xl">Trends</h2>
        <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
          World Bank · last ~20 years
        </div>
      </div>
      <div
        className={`grid gap-4 ${charts.length > 1 ? "lg:grid-cols-2" : ""}`}
      >
        {charts.map((c) => (
          <TrendChart
            key={c.key}
            title={c.title}
            data={c.points}
            color={c.color}
            kind={c.kind}
            format={c.format}
            gradientId={`grad-${c.key}`}
          />
        ))}
      </div>
    </section>
  );
}
