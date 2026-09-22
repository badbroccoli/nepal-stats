import { SimpleBars } from "@/components/Charts";
import { DomainPage } from "@/components/DomainPage";

const mig = [
  { name: "Gulf %", value: 58 },
  { name: "Malaysia %", value: 18 },
  { name: "Approvals k", value: 750 },
  { name: "Absent m", value: 2.2 },
];

export default function MigrationPage() {
  return (
    <DomainPage id="migration">
      <div className="mt-8">
        <h2 className="mb-3 display text-xl">Labor migration profile</h2>
        <SimpleBars data={mig} xKey="name" yKey="value" color="#F72585" />
      </div>
    </DomainPage>
  );
}
