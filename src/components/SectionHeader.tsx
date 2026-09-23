import type { DomainMeta } from "@/lib/types";
import Link from "next/link";
import { DomainExplorer } from "@/components/visual/DomainExplorer";

export function SectionHeader({
  title,
  titleNp,
  blurb,
  accent,
}: {
  title: string;
  titleNp?: string;
  blurb?: string;
  accent?: string;
}) {
  return (
    <div className="relative mb-7 animate-rise overflow-hidden rounded-sm border border-[var(--border)] px-5 py-6 md:px-7 md:py-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(700px 280px at 0% 0%, ${accent ?? "#3ddc97"}28 0%, transparent 55%), linear-gradient(160deg, #141414 0%, #0c0c0c 100%)`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 top-0 h-full w-1/2 opacity-40"
        style={{
          background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Cpath fill='${encodeURIComponent((accent ?? "#3ddc97") + "22")}' d='M0 160L50 130 100 150 150 90 200 120 250 60 300 100 350 50 400 80V200H0Z'/%3E%3C/svg%3E") bottom right / cover no-repeat`,
        }}
        aria-hidden
      />
      <div className="relative">
        <div className="section-kicker">Domain</div>
        <div className="display mt-2 text-3xl md:text-5xl">{title}</div>
        {titleNp && (
          <div className="mt-1 text-sm text-[var(--muted)]">{titleNp}</div>
        )}
        {blurb && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            {blurb}
          </p>
        )}
      </div>
    </div>
  );
}

export function DomainCards({ domains }: { domains: DomainMeta[] }) {
  return <DomainExplorer domains={domains} />;
}

export function SourceStamp({
  text = "Figures mix live connectors (NRB, USGS, RSS, World Bank) with curated official releases. Estimated values are labeled.",
}: {
  text?: string;
}) {
  return (
    <p className="mt-8 border-t border-[var(--border)] pt-4 text-xs leading-relaxed text-[var(--muted)]">
      {text}
    </p>
  );
}

/** Kept for any legacy imports that still pass Link-style domain cards. */
export function DomainCardLink({
  domain,
}: {
  domain: DomainMeta;
}) {
  return (
    <Link
      href={domain.href}
      className="panel group rounded-sm p-4 transition hover:border-[#333]"
    >
      <div
        className="mb-3 h-1 w-10 rounded-full"
        style={{ background: domain.accent }}
      />
      <div className="display text-lg group-hover:text-white">{domain.title}</div>
      <div className="mt-1 text-xs text-[var(--muted)]">{domain.titleNp}</div>
      <p className="mt-2 text-sm text-[var(--muted)]">{domain.blurb}</p>
    </Link>
  );
}
