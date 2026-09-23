"use client";

import { useEffect, useState } from "react";

export function RingGauge({
  value,
  max = 100,
  size = 72,
  stroke = 7,
  color = "var(--accent)",
  label,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const offset = c * (1 - (ready ? pct : 0));

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={label ?? `${Math.round(pct * 100)}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#ffffff12"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="mono text-[11px] tabular-nums text-[var(--text)]">
          {Math.round(pct * 100)}
          <span className="text-[var(--muted)]">%</span>
        </span>
      </div>
    </div>
  );
}
