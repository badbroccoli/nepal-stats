import { SimpleBars } from "@/components/Charts";
import { DomainPage } from "@/components/DomainPage";

const outcomes = [
  { name: "MMR", value: 151 },
  { name: "U5MR", value: 27 },
  { name: "Stunting %", value: 25 },
  { name: "Immunization %", value: 78 },
];

export default function HealthPage() {
  return (
    <DomainPage id="health">
      <div className="mt-8">
        <h2 className="mb-3 display text-xl">Outcome indicators</h2>
        <SimpleBars data={outcomes} xKey="name" yKey="value" color="#41B3A3" />
      </div>
    </DomainPage>
  );
}
