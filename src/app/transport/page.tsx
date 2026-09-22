import { SimpleBars } from "@/components/Charts";
import { DomainPage } from "@/components/DomainPage";

const transport = [
  { name: "Vehicles m", value: 4.5 },
  { name: "EV new %", value: 12 },
  { name: "Road deaths", value: 2.8 },
  { name: "Air pax m", value: 3.8 },
];

export default function TransportPage() {
  return (
    <DomainPage id="transport">
      <div className="mt-8">
        <h2 className="mb-3 display text-xl">Mobility indicators</h2>
        <SimpleBars data={transport} xKey="name" yKey="value" color="#90BE6D" />
      </div>
    </DomainPage>
  );
}
