import { DomainCards, SourceStamp } from "@/components/SectionHeader";
import { KpiCard } from "@/components/KpiCard";
import { NepalMap } from "@/components/NepalMap";
import { NewsRail } from "@/components/NewsRail";
import { PopulationTicker } from "@/components/PopulationTicker";
import { ForexLadder } from "@/components/visual/ForexLadder";
import { DisasterFeed, HazardMixBars } from "@/components/visual/HazardVisuals";
import { buildPulse } from "@/lib/connectors/pulse";
import { CENSUS_POPULATION_2021 } from "@/lib/seed/metrics";
import { timeAgo } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const pulse = await buildPulse();
  const [pop, ...rest] = pulse.metrics;

  const hazardMix = Object.values(
    pulse.disasters.reduce<
      Record<string, { hazard: string; count: number; color: string }>
    >((acc, d) => {
      if (!acc[d.hazard]) {
        acc[d.hazard] = {
          hazard: d.hazard,
          count: 0,
          color: d.hazardColor,
        };
      }
      acc[d.hazard].count += 1;
      return acc;
    }, {}),
  ).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-10">
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <PopulationTicker
          estimate={pulse.populationEstimate}
          census={CENSUS_POPULATION_2021}
        />
        <div className="hero-panel flex flex-col justify-between rounded-sm p-5 md:p-7">
          <div className="relative z-[1]">
            <div className="section-kicker">National pulse</div>
            <h1 className="display mt-3 text-4xl leading-[1.05] md:text-5xl">
              <span className="text-[var(--accent)]">Nepal</span>Stats
            </h1>
            <p className="mt-2 display text-2xl text-[var(--muted)] md:text-3xl">
              Everything Nepal, at a glance.
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--muted)]">
              Live FX, natural disasters, and news — plus curated official stats
              across people, markets, government, health, education, energy,
              climate, tourism, digital, transport, agriculture, and migration.
            </p>
          </div>
          <div className="relative z-[1] mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/places"
              className="inline-flex items-center gap-2 rounded-sm border border-[var(--accent)] bg-[#3ddc9718] px-4 py-2 text-sm text-[var(--accent)] transition hover:bg-[#3ddc9728]"
            >
              Open map explorer
              <span aria-hidden>→</span>
            </Link>
            <span className="text-xs text-[var(--muted)]">
              Updated {timeAgo(pulse.generatedAt)}
            </span>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <div className="section-kicker">Snapshot</div>
            <h2 className="display mt-1 text-2xl">Pulse indicators</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {pop && <KpiCard metric={pop} large />}
          {rest.map((m) => (
            <KpiCard key={m.key} metric={m} />
          ))}
        </div>
      </section>

      <section className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(260px,0.7fr)]">
        <div className="min-w-0 min-h-0">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <div className="section-kicker">Geography</div>
              <h2 className="display mt-1 text-2xl">Hazards on the map</h2>
            </div>
            <Link
              href="/disasters"
              className="text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]"
            >
              Disasters →
            </Link>
          </div>
          <div className="h-[560px] min-h-0 overflow-hidden rounded-sm">
            <NepalMap
              incidents={pulse.disasters}
              quakes={pulse.quakes}
              height="560px"
            />
          </div>
        </div>
        <div className="min-w-0 h-[560px] lg:h-auto lg:min-h-[600px]">
          <NewsRail items={pulse.news} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel rounded-sm p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <div className="section-kicker">NRB</div>
              <h2 className="display mt-1 text-xl">Forex ladder</h2>
            </div>
            <Link
              href="/economy"
              className="text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]"
            >
              Economy →
            </Link>
          </div>
          <ForexLadder rates={pulse.forex} />
        </div>
        <div className="panel rounded-sm p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <div className="section-kicker">Safety</div>
              <h2 className="display mt-1 text-xl">Recent hazards</h2>
            </div>
          </div>
          {hazardMix.length > 0 && (
            <div className="mb-5">
              <HazardMixBars items={hazardMix} />
            </div>
          )}
          <DisasterFeed disasters={pulse.disasters.slice(0, 8)} />
        </div>
      </section>

      <section>
        <div className="mb-4">
          <div className="section-kicker">Browse</div>
          <h2 className="display mt-1 text-2xl md:text-3xl">
            Explore every domain
          </h2>
        </div>
        <DomainCards domains={pulse.domains} />
      </section>

      <SourceStamp />
    </div>
  );
}
