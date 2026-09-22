import { DomainCards, SourceStamp } from "@/components/SectionHeader";
import { KpiCard } from "@/components/KpiCard";
import { CountryMap } from "@/components/CountryMap";
import { NewsRail } from "@/components/NewsRail";
import { PopulationTicker } from "@/components/PopulationTicker";
import type { Country } from "@/lib/countries";
import type { PulsePayload } from "@/lib/types";
import { formatNumber, timeAgo } from "@/lib/format";
import Link from "next/link";

export function CountryPulseView({
  country,
  pulse,
}: {
  country: Country;
  pulse: PulsePayload;
}) {
  const [pop, ...rest] = pulse.metrics;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <PopulationTicker
          estimate={pulse.populationEstimate}
          census={country.population ?? Math.round(pulse.populationEstimate)}
        />
        <div className="panel flex flex-col justify-between rounded-sm p-5">
          <div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={country.flag}
                alt=""
                width={36}
                height={24}
                className="h-5 w-7 rounded-[1px] object-cover"
              />
              National pulse · {country.code.toUpperCase()}
            </div>
            <h1 className="display mt-2 text-3xl md:text-4xl">
              {country.name}, in one dark dashboard.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Live markets, hazards, and headlines
              {country.capital ? ` — capital ${country.capital}` : ""}
              {country.region ? ` · ${country.region}` : ""}. Domain pages reuse
              the same national model for every country.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
            <span>Updated {timeAgo(pulse.generatedAt)}</span>
            <Link
              href={`/${country.code}/places`}
              className="text-[var(--accent)]"
            >
              Open map explorer →
            </Link>
            <Link href="/" className="hover:text-white">
              Change country
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {pop && <KpiCard metric={pop} large />}
        {rest.map((m) => (
          <KpiCard key={m.key} metric={m} />
        ))}
      </section>

      <section className="grid items-stretch gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="h-[520px] min-h-0">
          <CountryMap
            country={country}
            incidents={pulse.disasters}
            quakes={pulse.quakes}
            height="520px"
          />
        </div>
        <div className="h-[520px] min-h-0">
          <NewsRail items={pulse.news} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel rounded-sm p-4">
          <h2 className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Forex
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                <tr>
                  <th className="pb-2 font-normal">Currency</th>
                  <th className="pb-2 font-normal">Unit</th>
                  <th className="pb-2 font-normal">Buy</th>
                  <th className="pb-2 font-normal">Sell</th>
                </tr>
              </thead>
              <tbody>
                {pulse.forex.map((r) => (
                  <tr key={r.iso3} className="border-t border-[var(--border)]">
                    <td className="py-2">
                      {r.iso3}{" "}
                      <span className="text-[var(--muted)]">{r.currency}</span>
                    </td>
                    <td className="mono py-2">{r.unit}</td>
                    <td className="mono py-2">{formatNumber(r.buy, 2)}</td>
                    <td className="mono py-2">{formatNumber(r.sell, 2)}</td>
                  </tr>
                ))}
                {pulse.forex.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-3 text-sm text-[var(--muted)]"
                    >
                      FX feed unavailable right now.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel rounded-sm p-4">
          <h2 className="mb-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Recent natural disasters
          </h2>
          <ul className="space-y-2">
            {pulse.disasters.length === 0 && (
              <li className="text-sm text-[var(--muted)]">
                No recent hazard events in this country window.
              </li>
            )}
            {pulse.disasters.map((d) => (
              <li
                key={d.id}
                className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-2 text-sm"
              >
                <div className="flex items-start gap-2">
                  <span
                    className="mt-1.5 inline-block h-2 w-2 shrink-0"
                    style={{ background: d.hazardColor }}
                    aria-hidden
                  />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      {d.hazard}
                    </span>
                    <div>{d.title}</div>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] text-[var(--muted)]">
                  {timeAgo(d.time)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <DomainCards domains={pulse.domains} />
      <SourceStamp />
    </div>
  );
}
