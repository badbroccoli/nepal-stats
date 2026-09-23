"use client";

import { formatNumber } from "@/lib/format";
import type { ForexRate } from "@/lib/types";

export function ForexLadder({ rates }: { rates: ForexRate[] }) {
  if (!rates.length) {
    return (
      <p className="text-sm text-[var(--muted)]">Forex feed unavailable.</p>
    );
  }

  const maxSell = Math.max(...rates.map((r) => r.sell / r.unit));

  return (
    <div className="space-y-3">
      {rates.map((r, i) => {
        const unitSell = r.sell / r.unit;
        const unitBuy = r.buy / r.unit;
        const spread = ((r.sell - r.buy) / r.buy) * 100;
        const width = Math.max(8, (unitSell / maxSell) * 100);

        return (
          <div
            key={r.iso3}
            className="animate-rise"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="display text-lg leading-none">{r.iso3}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  {r.currency}
                  {r.unit !== 1 ? ` · per ${r.unit}` : ""}
                </span>
              </div>
              <div className="mono text-right text-sm tabular-nums">
                <span className="text-[var(--accent)]">
                  {formatNumber(r.buy, 2)}
                </span>
                <span className="mx-1 text-[var(--muted)]">/</span>
                <span>{formatNumber(r.sell, 2)}</span>
              </div>
            </div>
            <div className="relative h-2 overflow-hidden rounded-sm bg-[#ffffff08]">
              <div
                className="absolute inset-y-0 left-0 rounded-sm bg-gradient-to-r from-[#3ddc9740] to-[#3ddc97]"
                style={{
                  width: `${width}%`,
                  transition: "width 0.9s cubic-bezier(.22,1,.36,1)",
                }}
              />
              <div
                className="absolute inset-y-0 rounded-sm bg-[#f4d35e66]"
                style={{
                  left: `${Math.max(0, width - 6)}%`,
                  width: "6%",
                }}
                title={`Spread ${spread.toFixed(2)}%`}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-[var(--muted)]">
              <span>buy {formatNumber(unitBuy, 2)} / unit</span>
              <span className="mono">spread {spread.toFixed(2)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
