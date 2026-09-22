"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/lib/format";

export function PopulationTicker({
  estimate,
  census,
}: {
  estimate: number;
  census: number;
}) {
  const [value, setValue] = useState(estimate);
  const [prevEstimate, setPrevEstimate] = useState(estimate);
  if (estimate !== prevEstimate) {
    setPrevEstimate(estimate);
    setValue(estimate);
  }

  const perSecond = useMemo(() => {
    // ~0.92% annual ≈ estimate * 0.0092 / seconds_per_year
    return (estimate * 0.0092) / (365.25 * 24 * 3600);
  }, [estimate]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setValue((v) => v + perSecond);
    }, 1000);
    return () => window.clearInterval(id);
  }, [perSecond]);

  return (
    <div className="panel relative overflow-hidden rounded-sm p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#1c3328,transparent_45%)]" />
      <div className="relative">
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Nepal population · estimated
        </div>
        <div className="display mt-3 text-5xl tabular-nums md:text-7xl">
          {formatNumber(Math.round(value))}
        </div>
        <p className="mt-3 max-w-xl text-sm text-[var(--muted)]">
          Interpolated from NSO NPHC 2021 baseline ({formatNumber(census)}) with
          a documented growth model — not an official live census counter.
        </p>
      </div>
    </div>
  );
}
