import { MetricGrid } from "@/components/KpiCard";
import { SectionHeader, SourceStamp } from "@/components/SectionHeader";
import { domainsFor } from "@/lib/domains";
import { getCountryDomainMetrics } from "@/lib/connectors/domainMetrics";
import { getCountry } from "@/lib/countries";
import type { DomainId, Metric } from "@/lib/types";
import type { ReactNode } from "react";

export async function DomainPage({
  id,
  countryCode = "np",
  metrics: metricsProp,
  children,
}: {
  id: DomainId;
  countryCode?: string;
  /** Optional precomputed metrics (e.g. disasters with live counts). */
  metrics?: Metric[];
  children?: ReactNode;
}) {
  const meta = domainsFor(countryCode).find((d) => d.id === id)!;
  const country = getCountry(countryCode);
  const metrics =
    metricsProp ??
    (country ? await getCountryDomainMetrics(id, country) : []);

  return (
    <div>
      <SectionHeader
        title={meta.title}
        titleNp={meta.titleNp}
        blurb={meta.blurb}
      />
      <MetricGrid metrics={metrics} />
      {children}
      <SourceStamp
        text={
          countryCode === "np"
            ? undefined
            : "Figures prefer live World Bank indicators for this country, plus registry fields. Estimated or unavailable series are omitted."
        }
      />
    </div>
  );
}
