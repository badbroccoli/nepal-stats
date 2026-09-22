"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOMAINS } from "@/lib/domains";

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[#050505cc] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="group shrink-0">
          <div className="display text-xl leading-none md:text-2xl">
            Nepal<span className="text-[var(--accent)]">Stats</span>
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            One-stop national pulse
          </div>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
          <Link
            href="/"
            className={`rounded px-2 py-1 text-xs ${
              pathname === "/"
                ? "bg-[#1a1a1a] text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            Pulse
          </Link>
          {DOMAINS.map((d) => (
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
          <span className="live-dot" />
          Live feeds
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-[var(--border)] px-4 py-2 lg:hidden">
        <Link href="/" className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1 text-xs">
          Pulse
        </Link>
        {DOMAINS.map((d) => (
          <Link
            key={d.id}
            href={d.href}
            className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]"
          >
            {d.title.split(" ")[0]}
          </Link>
        ))}
      </div>
    </header>
  );
}
