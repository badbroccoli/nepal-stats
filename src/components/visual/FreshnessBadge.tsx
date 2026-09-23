import type { Freshness } from "@/lib/types";

const LABELS: Record<Freshness, { text: string; tone: string }> = {
  RT: { text: "Live", tone: "var(--accent)" },
  NR: { text: "Near-real", tone: "#7BDFF2" },
  P: { text: "Published", tone: "var(--warn)" },
  E: { text: "Estimate", tone: "#E8A87C" },
};

export function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  const meta = LABELS[freshness];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em]"
      style={{
        borderColor: `${meta.tone}44`,
        color: meta.tone,
        background: `${meta.tone}14`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: meta.tone }}
        aria-hidden
      />
      {meta.text}
    </span>
  );
}
