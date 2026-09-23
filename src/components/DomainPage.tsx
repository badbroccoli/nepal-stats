import { MetricGrid } from "@/components/KpiCard";
import { SectionHeader, SourceStamp } from "@/components/SectionHeader";
import { DOMAINS } from "@/lib/domains";
import { getDomainMetrics } from "@/lib/connectors/pulse";
import type { DomainId } from "@/lib/types";
import type { ReactNode } from "react";

export function DomainPage({
  id,
  children,
}: {
  id: DomainId;
  children?: ReactNode;
}) {
  const meta = DOMAINS.find((d) => d.id === id)!;
  const metrics = getDomainMetrics(id);

  return (
    <div>
      <SectionHeader
        title={meta.title}
        titleNp={meta.titleNp}
        blurb={meta.blurb}
        accent={meta.accent}
      />
      <MetricGrid metrics={metrics} />
      {children}
      <SourceStamp />
    </div>
  );
}
