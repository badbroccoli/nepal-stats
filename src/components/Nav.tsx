"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
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
            className={`rounded-sm px-2.5 py-1 text-xs transition ${
              pathname === "/"
                ? "bg-[#3ddc9718] text-[var(--accent)] shadow-[inset_0_-1px_0_0_var(--accent)]"
                : "text-[var(--muted)] hover:bg-[#ffffff08] hover:text-white"
            }`}
          >
            Pulse
          </Link>
          {DOMAINS.map((d) => (
            <Link
              key={d.id}
              href={d.href}
              className={`whitespace-nowrap rounded-sm px-2.5 py-1 text-xs transition ${
                pathname === d.href
                  ? "bg-[#ffffff10] text-white shadow-[inset_0_-1px_0_0_var(--tile)]"
                  : "text-[var(--muted)] hover:bg-[#ffffff08] hover:text-white"
              }`}
              style={
                pathname === d.href
                  ? ({ ["--tile" as string]: d.accent } as CSSProperties)
                  : undefined
              }
            >
              {d.title.split(" & ")[0]}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 rounded-sm border border-[#3ddc9730] bg-[#3ddc970c] px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--accent)]">
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
