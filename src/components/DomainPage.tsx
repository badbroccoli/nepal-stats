import { MetricGrid } from "@/components/KpiCard";
import { SectionHeader, SourceStamp } from "@/components/SectionHeader";
import { domainsFor } from "@/lib/domains";
import { getDomainMetrics } from "@/lib/connectors/pulse";
import type { DomainId } from "@/lib/types";
import type { ReactNode } from "react";

export function DomainPage({
  id,
  countryCode = "np",
  children,
}: {
  id: DomainId;
  countryCode?: string;
  children?: ReactNode;
}) {
  const meta = domainsFor(countryCode).find((d) => d.id === id)!;
  const metrics = getDomainMetrics(id);

  return (
    <div>
      <SectionHeader
        title={meta.title}
        titleNp={meta.titleNp}
        blurb={meta.blurb}
      />
      <MetricGrid metrics={metrics} />
      {children}
      <SourceStamp />
    </div>
  );
}
