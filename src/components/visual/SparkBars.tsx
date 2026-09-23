"use client";

/** Decorative relative bars for KPI context when no time series exists. */
export function SparkBars({
  seed,
  color = "var(--accent)",
  bars = 12,
}: {
  seed: string;
  color?: string;
  bars?: number;
}) {
  const heights = Array.from({ length: bars }, (_, i) => {
    let h = 0;
    for (let j = 0; j < seed.length; j++) {
      h = (h + seed.charCodeAt(j) * (i + 3) * (j + 1)) % 97;
    }
    return 28 + (h % 72);
  });

  return (
    <div className="flex h-10 items-end gap-[3px]" aria-hidden>
      {heights.map((h, i) => (
        <span
          key={i}
          className="spark-bar inline-block w-[4px] rounded-sm"
          style={{
            height: `${h}%`,
            background: color,
            opacity: 0.25 + (i / bars) * 0.55,
            animationDelay: `${i * 45}ms`,
          }}
        />
      ))}
    </div>
  );
}
