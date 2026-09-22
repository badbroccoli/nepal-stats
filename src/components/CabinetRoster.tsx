import type { GovMember, CountryGovernment } from "@/lib/connectors/government";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function Portrait({
  member,
  featured = false,
}: {
  member: GovMember;
  featured?: boolean;
}) {
  const size = featured
    ? "h-28 w-28 md:h-36 md:w-36"
    : "h-20 w-20 md:h-24 md:w-24";

  if (member.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.photo}
        alt={`Portrait of ${member.name}`}
        width={featured ? 144 : 96}
        height={featured ? 144 : 96}
        className={`${size} shrink-0 rounded-sm object-cover object-top ring-1 ring-[#2a241c]`}
        loading={featured ? "eager" : "lazy"}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-sm bg-[#1a1612] text-lg tracking-wider text-[#c8b8a0] ring-1 ring-[#2a241c] md:text-xl`}
      aria-hidden
    >
      {initials(member.name)}
    </div>
  );
}

function MemberCard({
  member,
  featured = false,
}: {
  member: GovMember;
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
      <div className={`flex gap-4 ${featured ? "md:gap-5" : "gap-3"}`}>
        <Portrait member={member} featured={featured} />
        <div className="min-w-0 flex-1">
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
                {member.wikipediaUrl ? (
                  <a
                    href={member.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--accent)]"
                  >
                    {member.name}
                  </a>
                ) : (
                  member.name
                )}
              </h3>
              {member.nameNp && (
                <div className="mt-0.5 text-sm text-[var(--muted)]">
                  {member.nameNp}
                </div>
              )}
            </div>
            {member.party ? (
              <span className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                {member.party}
              </span>
            ) : null}
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
        </div>
      </div>
    </article>
  );
}

export function CabinetRoster({
  government,
  countryName,
}: {
  government: CountryGovernment;
  countryName: string;
}) {
  const { headOfState, headOfGovernment, ministers, asOf, sourceNote } =
    government;
  const featured = [headOfState, headOfGovernment].filter(
    Boolean,
  ) as GovMember[];
  // If HoS and HoG are the same person object-wise we may still have one slot
  const featuredUnique = featured.filter(
    (m, i, arr) => arr.findIndex((x) => x.name === m.name) === i,
  );
  const withPhotos =
    featuredUnique.filter((m) => m.photo).length +
    ministers.filter((m) => m.photo).length;
  const total = featuredUnique.length + ministers.length;

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="display text-xl md:text-2xl">
            Leadership &amp; cabinet
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Head of state, head of government, and ministers for {countryName} —
            portraits and short bios.
          </p>
        </div>
        <div className="mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
          As of {asOf} · {total} profiles · {withPhotos} portraits
        </div>
      </div>

      {featuredUnique.length === 0 && ministers.length === 0 && (
        <p className="panel rounded-sm p-4 text-sm text-[var(--muted)]">
          Live leadership data for {countryName} is not available right now.
          Try again shortly — rosters are loaded from Wikidata and Wikipedia.
        </p>
      )}

      <div className="space-y-3">
        {featuredUnique.map((m) => (
          <MemberCard key={`lead-${m.name}-${m.role}`} member={m} featured />
        ))}
      </div>

      {ministers.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ministers.map((m) => (
            <MemberCard key={`${m.name}-${m.role}`} member={m} />
          ))}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-[var(--muted)]">
        {sourceNote}
      </p>
    </section>
  );
}
