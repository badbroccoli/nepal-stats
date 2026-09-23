import type { ReactNode } from "react";
import {
  bandAt,
  colorAt,
  formatScaleTick,
  positionOnScale,
  scaleGradient,
  type ValueScale,
} from "@/lib/scales";

/**
 * Legend strip always reads Good → Bad left-to-right.
 * Marker position flips for higher-better scales so the value sits on the correct side.
 */
export function ScaleLegend({
  scale,
  value,
  compact,
}: {
  scale: ValueScale;
  value: number;
  compact?: boolean;
}) {
  const band = bandAt(scale, value);
  const color = colorAt(scale, value);
  const rawPos = positionOnScale(scale, value);
  const markerPos =
    (scale.kind === "higher-better" ? 1 - rawPos : rawPos) * 100;

  const gradient =
    scale.kind === "higher-better"
      ? goodToBadGradient(scale)
      : scaleGradient(scale);

  return (
    <div className={compact ? "mt-3" : "mt-4"}>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px]">
        <span className="uppercase tracking-[0.12em] text-[var(--muted)]">
          {scale.goodLabel}
          <span className="mx-1.5 text-[#ffffff30]">→</span>
          {scale.badLabel}
        </span>
        <span
          className="rounded-sm px-1.5 py-0.5 font-medium uppercase tracking-[0.1em]"
          style={{
            color,
            background: `${color}18`,
            boxShadow: `inset 0 0 0 1px ${color}44`,
          }}
        >
          {band.label}
        </span>
      </div>

      <div className="relative pt-3">
        <div
          className="absolute top-0 text-[9px] leading-none"
          style={{
            left: `clamp(0%, calc(${markerPos}% - 5px), calc(100% - 10px))`,
            color,
          }}
        >
          ▼
        </div>
        <div
          className="h-2 overflow-hidden rounded-sm"
          style={{ background: gradient }}
          role="img"
          aria-label={`${band.label}: ${value} (${scale.goodLabel} to ${scale.badLabel})`}
        />
        <div
          className="pointer-events-none absolute top-3 h-2 w-0.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_2px_#0008]"
          style={{ left: `${markerPos}%` }}
          aria-hidden
        />
      </div>

      {!compact && (
        <div className="mt-1.5 flex justify-between gap-1 text-[9px] text-[var(--muted)]">
          <span className="mono">
            {scale.kind === "higher-better"
              ? formatScaleTick(scale.max, scale)
              : formatScaleTick(scale.min, scale)}
            {scale.unit ? ` ${scale.unit}` : ""}
          </span>
          <span className="mono">
            {scale.kind === "higher-better"
              ? formatScaleTick(scale.min, scale)
              : formatScaleTick(scale.max, scale)}
            {scale.unit ? ` ${scale.unit}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}

/** Left = good color, right = bad color. */
function goodToBadGradient(scale: ValueScale): string {
  const span = scale.max - scale.min || 1;
  const mapped = scale.stops
    .map((s) => ({
      color: s.color,
      visualAt: scale.max - (s.at - scale.min),
    }))
    .sort((a, b) => a.visualAt - b.visualAt);

  const parts = mapped.map((s) => {
    const pct = ((s.visualAt - scale.min) / span) * 100;
    return `${s.color} ${pct.toFixed(1)}%`;
  });
  return `linear-gradient(90deg, ${parts.join(", ")})`;
}

export function ScaleChip({
  scale,
  value,
  children,
}: {
  scale: ValueScale;
  value: number;
  children: ReactNode;
}) {
  const color = colorAt(scale, value);
  return (
    <span
      className="inline-flex items-center justify-center rounded-sm px-1.5 py-0.5 mono text-sm tabular-nums"
      style={{
        color,
        background: `${color}22`,
        boxShadow: `inset 0 0 0 1px ${color}55`,
      }}
    >
      {children}
    </span>
  );
}
