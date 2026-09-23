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
    return (estimate * 0.0092) / (365.25 * 24 * 3600);
  }, [estimate]);

  const growthPct = ((estimate - census) / census) * 100;

  useEffect(() => {
    const id = window.setInterval(() => {
      setValue((v) => v + perSecond);
    }, 1000);
    return () => window.clearInterval(id);
  }, [perSecond]);

  return (
    <div className="hero-panel relative overflow-hidden rounded-sm p-5 md:p-7">
      <div className="relative z-[1]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="section-kicker">Nepal population · estimated</div>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#3ddc9740] bg-[#3ddc9714] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
            <span className="live-dot" />
            Counting
          </span>
        </div>

        <div className="display float-soft mt-4 text-5xl tabular-nums tracking-tight md:text-7xl">
          {formatNumber(Math.round(value))}
        </div>

        <div className="mt-5 grid max-w-lg gap-3 sm:grid-cols-2">
          <div className="rounded-sm border border-[var(--border)] bg-[#00000040] p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
              Census 2021
            </div>
            <div className="mono mt-1 text-lg tabular-nums">
              {formatNumber(census)}
            </div>
          </div>
          <div className="rounded-sm border border-[var(--border)] bg-[#00000040] p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
              Since census
            </div>
            <div className="mono mt-1 text-lg tabular-nums text-[var(--accent)]">
              +{growthPct.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[10px] text-[var(--muted)]">
            <span>Growth since NPHC 2021</span>
            <span className="mono">{growthPct.toFixed(2)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-sm bg-[#ffffff0c]">
            <div
              className="h-full rounded-sm bg-gradient-to-r from-[#3ddc9766] to-[#3ddc97]"
              style={{
                width: `${Math.min(100, growthPct * 8)}%`,
                transition: "width 1s cubic-bezier(.22,1,.36,1)",
              }}
            />
          </div>
        </div>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          Interpolated from NSO NPHC 2021 baseline with a documented growth
          model — not an official live census counter.
        </p>
      </div>
    </div>
  );
}
