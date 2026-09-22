import { MetricGrid } from "@/components/KpiCard";
import { OfficialSourcesPanel } from "@/components/OfficialSourcesPanel";
import { SectionHeader, SourceStamp } from "@/components/SectionHeader";
import { domainsFor } from "@/lib/domains";
import { getCountryDomainMetrics } from "@/lib/connectors/domainMetrics";
import { getCountry } from "@/lib/countries";
import type { DomainId, Metric } from "@/lib/types";
import type { ReactNode } from "react";

export async function DomainPage({
  id,
  countryCode = "us",
  metrics: metricsProp,
  children,
}: {
  id: DomainId;
  countryCode?: string;
  metrics?: Metric[];
  children?: ReactNode;
}) {
  const meta = domainsFor(countryCode).find((d) => d.id === id)!;
  const country = getCountry(countryCode);
  const metrics =
    metricsProp ??
    (country ? await getCountryDomainMetrics(id, country) : []);

  const activeConnectors = [
    ...new Set(
      metrics
        .map((m) => m.source.toLowerCase())
        .flatMap((s) => {
          const out: string[] = [];
          if (s.includes("eurostat")) out.push("eurostat");
          if (s.includes("world bank")) out.push("worldbank");
          if (s.includes("census")) out.push("census_us");
          if (s.includes("statistics canada") || s.includes("statcan"))
            out.push("statcan");
          if (s.includes("australian bureau") || s.includes("abs"))
            out.push("abs");
          if (s.includes("ibge")) out.push("ibge");
          if (s.includes("usgs")) out.push("usgs");
          return out;
        }),
    ),
  ];

  return (
    <div>
      <SectionHeader
        title={meta.title}
        titleNp={meta.titleNp}
        blurb={meta.blurb}
      />
      <MetricGrid metrics={metrics} />
      {children}
      {country && (
        <OfficialSourcesPanel
          countryCode={country.code}
          countryName={country.name}
          activeConnectors={activeConnectors}
        />
      )}
      <SourceStamp />
    </div>
  );
}
