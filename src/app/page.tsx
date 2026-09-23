import { DomainCards, SourceStamp } from "@/components/SectionHeader";
import { KpiCard } from "@/components/KpiCard";
import { NepalMap } from "@/components/NepalMap";
import { NewsRail } from "@/components/NewsRail";
import { PopulationTicker } from "@/components/PopulationTicker";
import { TalkingCloud } from "@/components/TalkingCloud";
import { ForexLadder } from "@/components/visual/ForexLadder";
import { DisasterFeed, HazardMixBars } from "@/components/visual/HazardVisuals";
import { buildPulse } from "@/lib/connectors/pulse";
import { fetchNepalTrends } from "@/lib/connectors/trends";
import { CENSUS_POPULATION_2021 } from "@/lib/seed/metrics";
import { buildTalkingNow } from "@/lib/talking";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [pulse, trends] = await Promise.all([
    buildPulse(),
    fetchNepalTrends(),
  ]);
  const [pop, ...rest] = pulse.metrics;
  const talking = buildTalkingNow(pulse.news, trends);

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
      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <PopulationTicker
          estimate={pulse.populationEstimate}
          census={CENSUS_POPULATION_2021}
        />
        <TalkingCloud data={talking} />
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

      <section>
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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(260px,0.7fr)] lg:h-[560px]">
          <div className="h-[420px] min-h-0 min-w-0 overflow-hidden rounded-sm lg:h-full">
            <NepalMap
              incidents={pulse.disasters}
              quakes={pulse.quakes}
              height="100%"
            />
          </div>
          <div className="h-[420px] min-h-0 min-w-0 lg:h-full">
            <NewsRail items={pulse.news} />
          </div>
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
