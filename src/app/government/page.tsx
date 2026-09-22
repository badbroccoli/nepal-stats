import { CabinetRoster } from "@/components/CabinetRoster";
import { SimpleBars } from "@/components/Charts";
import { DomainPage } from "@/components/DomainPage";

const fiscal = [
  { name: "Revenue", value: 1120 },
  { name: "Spend", value: 1450 },
  { name: "Transfers", value: 420 },
  { name: "Capital", value: 261 },
];

export default function GovernmentPage() {
  return (
    <DomainPage id="government">
      <CabinetRoster />
      <div className="mt-8">
        <h2 className="mb-3 display text-xl">Fiscal flows (bn NPR, indicative)</h2>
        <SimpleBars data={fiscal} xKey="name" yKey="value" color="#E8A87C" />
      </div>
    </DomainPage>
  );
}
