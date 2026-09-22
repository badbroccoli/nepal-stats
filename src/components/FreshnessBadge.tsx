import type { Freshness } from "@/lib/types";

const STYLES: Record<Freshness, string> = {
  official: "bg-accent-muted/30 text-accent border-accent-muted/50",
  estimated: "bg-warn/10 text-warn border-warn/30",
  "near-real-time": "bg-accent/10 text-accent border-accent/30",
  daily: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  unknown: "bg-neutral-500/10 text-neutral-400 border-neutral-500/30",
};

const LABELS: Record<Freshness, string> = {
  official: "Official",
  estimated: "Estimated",
  "near-real-time": "Live",
  daily: "Daily",
  unknown: "Unknown",
};

export function FreshnessBadge({ freshness, stale }: { freshness: Freshness; stale?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STYLES[freshness]}`}
      >
        {LABELS[freshness]}
      </span>
      {stale && (
        <span
          title="Live source unreachable — showing last cached snapshot"
          className="rounded border border-danger/40 bg-danger/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-danger"
        >
          Cached
        </span>
      )}
    </span>
  );
}
