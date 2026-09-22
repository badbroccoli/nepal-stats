import type { DomainMeta } from "@/lib/types";
import Link from "next/link";

export function SectionHeader({
  title,
  titleNp,
  blurb,
}: {
  title: string;
  titleNp?: string;
  blurb?: string;
}) {
  return (
    <div className="mb-6 animate-rise">
      <div className="display text-3xl md:text-4xl">{title}</div>
      {titleNp && (
        <div className="mt-1 text-sm text-[var(--muted)]">{titleNp}</div>
      )}
      {blurb && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          {blurb}
        </p>
      )}
    </div>
  );
}

export function DomainCards({ domains }: { domains: DomainMeta[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {domains.map((d, i) => (
        <Link
          key={d.id}
          href={d.href}
          className="panel group rounded-sm p-4 transition hover:border-[#333]"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <div
            className="mb-3 h-1 w-10 rounded-full"
            style={{ background: d.accent }}
          />
          <div className="display text-lg group-hover:text-white">{d.title}</div>
          <div className="mt-1 text-xs text-[var(--muted)]">{d.titleNp}</div>
          <p className="mt-2 text-sm text-[var(--muted)]">{d.blurb}</p>
        </Link>
      ))}
    </div>
  );
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
