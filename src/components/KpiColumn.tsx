"use client";

import { FreshnessBadge } from "./FreshnessBadge";
import { formatCompact, formatNumber, formatRelative } from "@/lib/format";
import { usePolling } from "@/lib/usePolling";
import type { Kpi, NationalKpis } from "@/lib/types";

function KpiCard({ kpi, display }: { kpi: Kpi; display: string }) {
  return (
    <div className="rounded-lg border border-line bg-base-850 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-neutral-400">{kpi.label}</span>
        <FreshnessBadge freshness={kpi.freshness} stale={kpi.stale} />
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-semibold text-neutral-50">{display}</span>
        {kpi.unit && <span className="text-xs text-neutral-500">{kpi.unit}</span>}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
        <span className="truncate" title={kpi.source}>
          {kpi.source}
        </span>
        <span>{formatRelative(kpi.observedAt)}</span>
      </div>
      {kpi.note && <p className="mt-1 text-[11px] leading-snug text-neutral-600">{kpi.note}</p>}
    </div>
  );
}

export function KpiColumn() {
  const { data, error, loading } = usePolling<NationalKpis>("/api/v1/kpis/national", 30_000);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        National KPIs
      </h2>
      {loading && !data && <p className="px-1 text-xs text-neutral-500">Loading metrics…</p>}
      {error && !data && (
        <p className="px-1 text-xs text-danger">Failed to load KPIs: {error}</p>
      )}
      {data && (
        <>
          <KpiCard kpi={data.population} display={formatCompact(data.population.value)} />
          <KpiCard kpi={data.crudeBirthRate} display={data.crudeBirthRate.value.toFixed(1)} />
          <KpiCard kpi={data.forexUsd} display={data.forexUsd.value.toFixed(2)} />
          <KpiCard kpi={data.earthquakes24h} display={formatNumber(data.earthquakes24h.value)} />
          <p className="px-1 pt-1 text-[10px] leading-relaxed text-neutral-600">
            Population is an annual estimate, not a live counter. Every metric shows its source and
            as-of time, per the project&apos;s honesty guidelines.
          </p>
        </>
      )}
    </div>
  );
}
