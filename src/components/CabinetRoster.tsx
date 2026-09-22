import { CABINET, CABINET_AS_OF, type CabinetMember } from "@/lib/seed/cabinet";

function MemberCard({
  member,
  featured = false,
}: {
  member: CabinetMember;
  featured?: boolean;
}) {
  return (
    <article
      className={
        featured
          ? "panel rounded-sm border border-[#3a2a1a] bg-[#14100c] p-5 md:p-6"
          : "panel rounded-sm p-4"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
            {member.role}
          </div>
          <h3
            className={
              featured
                ? "display mt-1 text-2xl md:text-3xl"
                : "display mt-1 text-xl"
            }
          >
            {member.name}
          </h3>
          {member.nameNp && (
            <div className="mt-0.5 text-sm text-[var(--muted)]">
              {member.nameNp}
            </div>
          )}
        </div>
        <span className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
          {member.party}
        </span>
      </div>
      <p
        className={
          featured
            ? "mt-3 text-sm leading-relaxed text-[#c8c4bc]"
            : "mt-2 text-sm leading-relaxed text-[var(--muted)]"
        }
      >
        {member.bio}
      </p>
    </article>
  );
}

export function CabinetRoster() {
  const pm = CABINET.find((m) => m.tier === "pm");
  const ministers = CABINET.filter((m) => m.tier === "minister");

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="display text-xl md:text-2xl">
            Prime Minister &amp; cabinet
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Incumbent Council of Ministers with short public bios.
          </p>
        </div>
        <div className="mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
          As of {CABINET_AS_OF} · {CABINET.length} members
        </div>
      </div>

      {pm && <MemberCard member={pm} featured />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ministers.map((m) => (
          <MemberCard key={m.name + m.role} member={m} />
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--muted)]">
        Curated from public reporting (OPMCM / Radio Nepal / national press /
        Wikipedia). Portfolios change with reshuffles — treat as a living
        snapshot, not an official gazette extract.
      </p>
    </section>
  );
}
