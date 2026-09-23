"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CommandPalette } from "@/components/CommandPalette";
import { DOMAINS } from "@/lib/domains";
import {
  DOMAIN_CLUSTERS,
  NAV_PINS,
  clusterForPath,
  domainsInCluster,
  type DomainCluster,
} from "@/lib/nav";

function ClusterMenu({
  cluster,
  active,
}: {
  cluster: DomainCluster;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const items = domainsInCluster(cluster);
  const pathname = usePathname();
  const router = useRouter();

  const place = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const width = 288; // w-72
    const left = Math.min(
      Math.max(8, r.left),
      Math.max(8, window.innerWidth - width - 8),
    );
    setCoords({ top: r.bottom + 6, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onWin = () => place();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // click (not mousedown) so link navigation isn't raced
    document.addEventListener("click", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu =
    open &&
    coords &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={menuRef}
        id={menuId}
        role="menu"
        className="fixed z-[200] w-72 rounded-sm border border-[var(--border)] bg-[#0e0e0e] p-1.5 shadow-[0_16px_48px_#000c]"
        style={{ top: coords.top, left: coords.left }}
      >
        <div className="mb-1 flex items-center justify-between px-2.5 py-1.5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
              {cluster.labelNp}
            </div>
            <div className="text-xs text-[var(--muted)]">{cluster.blurb}</div>
          </div>
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: cluster.accent }}
            aria-hidden
          />
        </div>
        {items.map((d) => {
          const on = pathname === d.href;
          return (
            <a
              key={d.id}
              href={d.href}
              role="menuitem"
              className={`flex items-start gap-3 rounded-sm px-2.5 py-2 transition ${
                on ? "bg-[#ffffff10]" : "hover:bg-[#ffffff08]"
              }`}
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
                router.push(d.href);
              }}
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: d.accent }}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block text-sm leading-tight">{d.title}</span>
                <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                  {d.blurb}
                </span>
              </span>
            </a>
          );
        })}
      </div>,
      document.body,
    );

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        className={`inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-xs transition ${
          active || open
            ? "bg-[#ffffff10] text-white"
            : "text-[var(--muted)] hover:bg-[#ffffff08] hover:text-white"
        }`}
        style={
          active
            ? { boxShadow: `inset 0 -1px 0 0 ${cluster.accent}` }
            : undefined
        }
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {cluster.label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          className={`opacity-60 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            d="M2.5 4.5L6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>
      {menu}
    </div>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeCluster = clusterForPath(pathname);
  const pinMetas = NAV_PINS.map((id) => DOMAINS.find((d) => d.id === id)!);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 overflow-visible border-b border-[var(--border)] bg-[#050505ee]">
        <div className="pointer-events-none absolute inset-0 backdrop-blur-md" aria-hidden />
        <div className="relative mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 md:px-6">
          <Link href="/" className="group shrink-0">
            <div className="display text-xl leading-none md:text-2xl">
              Nepal<span className="text-[var(--accent)]">Stats</span>
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              One-stop national pulse
            </div>
          </Link>

          <nav className="ml-2 hidden flex-1 items-center gap-0.5 overflow-visible lg:flex">
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

            {DOMAIN_CLUSTERS.map((c) => (
              <ClusterMenu
                key={c.id}
                cluster={c}
                active={activeCluster?.id === c.id}
              />
            ))}

            {pinMetas.map((d) => (
              <Link
                key={d.id}
                href={d.href}
                className={`rounded-sm px-2.5 py-1 text-xs transition ${
                  pathname === d.href
                    ? "bg-[#ffffff10] text-white"
                    : "text-[var(--muted)] hover:bg-[#ffffff08] hover:text-white"
                }`}
                style={
                  pathname === d.href
                    ? { boxShadow: `inset 0 -1px 0 0 ${d.accent}` }
                    : undefined
                }
              >
                {d.title.split(" & ")[0]}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="inline-flex items-center gap-2 rounded-sm border border-[var(--border)] bg-[#0a0a0a] px-2.5 py-1.5 text-xs text-[var(--muted)] transition hover:border-[#333] hover:text-white"
              aria-label="Jump to topic"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <span className="hidden sm:inline">Jump to…</span>
              <kbd className="mono hidden rounded-sm border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)] md:inline">
                ⌘/Ctrl K
              </kbd>
            </button>

            <div className="hidden items-center gap-2 rounded-sm border border-[#3ddc9730] bg-[#3ddc970c] px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--accent)] xl:flex">
              <span className="live-dot" />
              Live
            </div>

            <button
              type="button"
              className="rounded-sm border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--muted)] lg:hidden"
              aria-expanded={mobileOpen}
              aria-label="Open topics"
              onClick={() => setMobileOpen((v) => !v)}
            >
              Topics
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="relative max-h-[70vh] overflow-y-auto border-t border-[var(--border)] px-4 py-3 lg:hidden">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="mb-3 block rounded-sm border border-[var(--border)] px-3 py-2 text-sm"
            >
              Pulse — national overview
            </Link>
            {DOMAIN_CLUSTERS.map((c) => (
              <div key={c.id} className="mb-4">
                <div className="mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: c.accent }}
                  />
                  {c.label}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {domainsInCluster(c).map((d) => (
                    <Link
                      key={d.id}
                      href={d.href}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-sm border px-2.5 py-2 text-xs ${
                        pathname === d.href
                          ? "border-[#ffffff30] bg-[#ffffff10]"
                          : "border-[var(--border)] text-[var(--muted)]"
                      }`}
                    >
                      {d.title.split(" & ")[0]}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-1.5">
              {pinMetas.map((d) => (
                <Link
                  key={d.id}
                  href={d.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-sm border border-[var(--border)] px-2.5 py-2 text-xs text-[var(--muted)]"
                >
                  {d.title.split(" & ")[0]}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {paletteOpen && (
        <CommandPalette onClose={() => setPaletteOpen(false)} />
      )}
    </>
  );
}
