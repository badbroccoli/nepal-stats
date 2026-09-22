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
  if (!agencies.length) return null;

  const active = new Set(activeConnectors);

  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="display text-xl md:text-2xl">Official data sources</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            National, federal, and international portals for {countryName}. Live
            figures prefer these agencies when an API is wired; otherwise World
            Bank compiles from national statistical systems.
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {agencies.map((a) => (
          <AgencyCard
            key={a.name + a.url}
            agency={a}
            live={Boolean(a.api?.type && active.has(a.api.type))}
          />
        ))}
      </div>
    </section>
  );
}

function AgencyCard({
  agency,
  live,
}: {
  agency: AgencyRef;
  live: boolean;
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
          {TIER_LABEL[agency.tier] ?? agency.tier} ·{" "}
          {KIND_LABEL[agency.kind] ?? agency.kind}
        </div>
        {live ? (
          <span className="rounded border border-[var(--accent)]/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[var(--accent)]">
            Live
          </span>
        ) : agency.api ? (
          <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[var(--muted)]">
            API
          </span>
        ) : null}
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
