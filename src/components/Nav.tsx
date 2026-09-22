"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { domainsFor } from "@/lib/domains";
import { getCountry } from "@/lib/countries";

export function Nav() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const maybeCountry = parts[0]?.toLowerCase();
  const country =
    maybeCountry && maybeCountry.length === 2
      ? getCountry(maybeCountry)
      : null;
  const domains = country ? domainsFor(country.code) : [];
  const pulseHref = country ? `/${country.code}` : "/";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[#050505cc] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="group shrink-0">
          <div className="display text-xl leading-none md:text-2xl">
            World<span className="text-[var(--accent)]">Stats</span>
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            {country ? country.name : "One-stop national pulse"}
          </div>
        </Link>

        {country && (
          <Link
            href={`/${country.code}`}
            className="hidden items-center gap-2 rounded border border-[var(--border)] px-2 py-1 sm:flex"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={country.flag}
              alt=""
              width={28}
              height={20}
              className="h-4 w-6 rounded-[1px] object-cover"
            />
            <span className="text-xs uppercase tracking-wider text-[var(--muted)]">
              {country.code}
            </span>
          </Link>
        )}

        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
          <Link
            href={pulseHref}
            className={`rounded px-2 py-1 text-xs ${
              pathname === pulseHref
                ? "bg-[#1a1a1a] text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            {country ? "Pulse" : "Countries"}
          </Link>
          {domains.map((d) => (
            <Link
              key={d.id}
              href={d.href}
              className={`whitespace-nowrap rounded px-2 py-1 text-xs ${
                pathname === d.href
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[var(--muted)] hover:text-white"
              }`}
            >
              {d.title.split(" & ")[0]}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--muted)]">
          <Link href="/" className="hover:text-white">
            All countries
          </Link>
          <span className="live-dot" />
          Live feeds
        </div>
      </div>

      {country && (
        <div className="flex gap-2 overflow-x-auto border-t border-[var(--border)] px-4 py-2 lg:hidden">
          <Link
            href={pulseHref}
            className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1 text-xs"
          >
            Pulse
          </Link>
          {domains.map((d) => (
            <Link
              key={d.id}
              href={d.href}
              className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]"
            >
              {d.title.split(" ")[0]}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
