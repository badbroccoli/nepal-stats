import { Dashboard } from "@/components/Dashboard";
import { KpiColumn } from "@/components/KpiColumn";
import { NewsRail } from "@/components/NewsRail";

export default function Home() {
  return (
    <div className="flex h-screen flex-col bg-base-950">
      <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-4 w-4 rounded-sm bg-accent" aria-hidden />
          <div>
            <h1 className="text-sm font-semibold text-neutral-100">
              Nepal Real-Time Statistics Dashboard
            </h1>
            <p className="text-[10px] text-neutral-500">
              Population · Disasters · Forex · News — with source &amp; freshness on every metric
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-neutral-500">
          <span className="rounded border border-line px-2 py-0.5">EN | ने</span>
          <span className="hidden sm:inline">MVP · Phase 0–3 lean build</span>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr_320px]">
        <aside className="min-h-0 border-r border-line bg-base-900">
          <KpiColumn />
        </aside>
        <section className="relative min-h-0">
          <Dashboard />
        </section>
        <aside className="hidden min-h-0 border-l border-line bg-base-900 lg:block">
          <NewsRail />
        </aside>
      </main>
    </div>
  );
}
