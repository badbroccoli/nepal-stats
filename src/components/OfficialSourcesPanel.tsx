"use client";

import { useEffect, useState } from "react";
import {
  listOfficialAgencies,
  type AgencyRef,
} from "@/lib/countrySources";

const KIND_LABEL: Record<string, string> = {
  nso: "National statistics",
  census: "Census",
  central_bank: "Central bank",
  open_data: "Open data",
  health: "Health",
  disaster: "Hazards",
  fx: "FX authority",
  other: "Agency",
};

const TIER_LABEL: Record<string, string> = {
  federal: "National / federal",
  state: "State / provincial",
  local: "Local",
  supranational: "International",
};

type ProbeRow = {
  name: string;
  url: string;
  tier: string;
  ok: boolean;
  status: number;
  ms: number;
};

type AccuracyPayload = {
  chosen: string;
  reason: string;
  deltaPct: number | null;
  withinTolerance: boolean | null;
  worldBank: number | null;
  official: {
    value: number;
    asOf: string;
    source: string;
    connector: string;
    tier: string;
  } | null;
};

export function OfficialSourcesPanel({
  countryCode,
  countryName,
  activeConnectors = [],
}: {
  countryCode: string;
  countryName: string;
  /** Connector ids that actually supplied numbers on this page */
  activeConnectors?: string[];
}) {
  const agencies = listOfficialAgencies(countryCode);
  const [probes, setProbes] = useState<ProbeRow[] | null>(null);
  const [accuracy, setAccuracy] = useState<AccuracyPayload | null>(null);
  const [probeState, setProbeState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  useEffect(() => {
    let cancelled = false;
    setProbeState("loading");
    fetch(`/api/sources?country=${encodeURIComponent(countryCode)}&probe=1`)
      .then(async (res) => {
        if (!res.ok) throw new Error("probe failed");
        return res.json() as Promise<{
          probes?: ProbeRow[];
          accuracy?: AccuracyPayload;
        }>;
      })
      .then((json) => {
        if (cancelled) return;
        setProbes(json.probes ?? []);
        setAccuracy(json.accuracy ?? null);
        setProbeState("done");
      })
      .catch(() => {
        if (!cancelled) setProbeState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  if (!agencies.length) return null;

  const active = new Set(activeConnectors);
  const probeByUrl = new Map((probes ?? []).map((p) => [p.url, p]));

  const tiers: Array<AgencyRef["tier"]> = [
    "federal",
    "state",
    "local",
    "supranational",
  ];
  const grouped = tiers
    .map((tier) => ({
      tier,
      items: agencies.filter((a) => a.tier === tier),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="display text-xl md:text-2xl">Official data sources</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Local, state/provincial, and federal portals for {countryName}. Live
            figures prefer national APIs when they pass a World Bank accuracy
            cross-check.
          </p>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
          {probeState === "loading" && "Probing portals…"}
          {probeState === "done" && probes && (
            <>
              {probes.filter((p) => p.ok).length}/{probes.length} reachable
            </>
          )}
          {probeState === "error" && "Probe unavailable"}
        </div>
      </div>

      {accuracy && (
        <div className="panel mb-4 rounded-sm p-3 text-sm">
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Population accuracy probe
          </div>
          <p className="mt-1 text-[var(--fg)]">{accuracy.reason}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--muted)]">
            {accuracy.official && (
              <span>
                Official ({accuracy.official.connector}):{" "}
                {Math.round(accuracy.official.value).toLocaleString()} ·{" "}
                {accuracy.official.asOf}
              </span>
            )}
            {accuracy.worldBank != null && (
              <span>
                World Bank: {Math.round(accuracy.worldBank).toLocaleString()}
              </span>
            )}
            {accuracy.deltaPct != null && (
              <span
                className={
                  accuracy.withinTolerance
                    ? "text-[var(--accent)]"
                    : "text-[#c45c26]"
                }
              >
                Δ {accuracy.deltaPct.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-5">
        {grouped.map(({ tier, items }) => (
          <div key={tier}>
            <h3 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
              {TIER_LABEL[tier] ?? tier}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => (
                <AgencyCard
                  key={a.name + a.url}
                  agency={a}
                  live={Boolean(a.api?.type && active.has(a.api.type))}
                  probe={probeByUrl.get(a.url)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AgencyCard({
  agency,
  live,
  probe,
}: {
  agency: AgencyRef;
  live: boolean;
  probe?: ProbeRow;
}) {
  return (
    <a
      href={agency.url}
      target="_blank"
      rel="noopener noreferrer"
      className="panel group block rounded-sm p-3 transition hover:border-[#3a3a3a] hover:bg-[#121212]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
          {KIND_LABEL[agency.kind] ?? agency.kind}
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {live ? (
            <span className="rounded border border-[var(--accent)]/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[var(--accent)]">
              Live
            </span>
          ) : agency.api ? (
            <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[var(--muted)]">
              API
            </span>
          ) : null}
          {probe && (
            <span
              className={`rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${
                probe.ok
                  ? "border-[var(--accent)]/40 text-[var(--accent)]"
                  : "border-[#c45c26]/50 text-[#c45c26]"
              }`}
              title={`HTTP ${probe.status} · ${probe.ms}ms`}
            >
              {probe.ok ? "Up" : "Down"}
            </span>
          )}
        </div>
      </div>
      <div className="mt-1 text-sm group-hover:text-white">{agency.name}</div>
      {(agency.notes || agency.api?.notes) && (
        <p className="mt-1 text-[11px] leading-snug text-[var(--muted)]">
          {agency.notes || agency.api?.notes}
        </p>
      )}
    </a>
  );
}
