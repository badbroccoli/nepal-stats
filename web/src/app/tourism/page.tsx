import { SimpleBars } from "@/components/Charts";
import { DomainPage } from "@/components/DomainPage";
import { TOURISM_BY_COUNTRY } from "@/lib/seed/metrics";

export default function TourismPage() {
  return (
    <DomainPage id="tourism">
      <div className="mt-8">
        <h2 className="mb-3 display text-xl">Arrivals by nationality (Aug 2026)</h2>
        <SimpleBars
          data={TOURISM_BY_COUNTRY.map((t) => ({
            name: t.country,
            arrivals: t.arrivals,
          }))}
          xKey="name"
          yKey="arrivals"
          color="#CDB4DB"
        />
      </div>
    </DomainPage>
  );
}
