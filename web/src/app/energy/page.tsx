import { SimpleBars } from "@/components/Charts";
import { DomainPage } from "@/components/DomainPage";

const energy = [
  { name: "Capacity MW", value: 3200 },
  { name: "Peak MW", value: 2200 },
  { name: "Access %", value: 97 },
  { name: "Hydro %", value: 95 },
];

export default function EnergyPage() {
  return (
    <DomainPage id="energy">
      <div className="mt-8">
        <h2 className="mb-3 display text-xl">Power system snapshot</h2>
        <SimpleBars data={energy} xKey="name" yKey="value" color="#FF9F1C" />
      </div>
    </DomainPage>
  );
}
